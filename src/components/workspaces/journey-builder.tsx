"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, X, Plus, Save, BookOpen, Link as LinkIcon, Sparkles } from "lucide-react";
import { JourneyStep, Journey } from "@/types/journey";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JourneyBuilderProps {
    workspaceId: string;
    onClose: () => void;
    existingJourney?: Journey;
}

interface LectureOption {
    id: string;
    title: string;
    subjectId: string;
    subjectName: string;
}

export function JourneyBuilder({ workspaceId, onClose, existingJourney }: JourneyBuilderProps) {
    const [name, setName] = useState(existingJourney?.name || "");
    const [description, setDescription] = useState(existingJourney?.description || "");
    const [steps, setSteps] = useState<JourneyStep[]>(existingJourney?.steps || []);
    const [availableLectures, setAvailableLectures] = useState<LectureOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLectures = async () => {
            try {
                const subjectsSnap = await getDocs(collection(db, "workspaces", workspaceId, "subjects"));
                const lectures: LectureOption[] = [];

                for (const subDoc of subjectsSnap.docs) {
                    const subData = subDoc.data();
                    const lecturesSnap = await getDocs(collection(db, "workspaces", workspaceId, "subjects", subDoc.id, "lectures"));
                    lecturesSnap.docs.forEach(lecDoc => {
                        lectures.push({
                            id: lecDoc.id,
                            title: lecDoc.data().title,
                            subjectId: subDoc.id,
                            subjectName: subData.name,
                        });
                    });
                }
                setAvailableLectures(lectures);
            } catch (error) {
                console.error("Load Error:", error);
                toast.error("Failed to load lectures.");
            } finally {
                setLoading(false);
            }
        };

        fetchLectures();
    }, [workspaceId]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const newSteps = Array.from(steps);
        const [reorderedItem] = newSteps.splice(result.source.index, 1);
        newSteps.splice(result.destination.index, 0, reorderedItem);
        setSteps(newSteps);
    };

    const addStep = (lecture: LectureOption) => {
        const newStep: JourneyStep = {
            id: crypto.randomUUID(),
            type: 'lecture',
            lectureId: lecture.id,
            subjectId: lecture.subjectId,
            workspaceId,
            title: lecture.title,
            subjectName: lecture.subjectName,
        };
        setSteps([...steps, newStep]);
    };

    const addPlaceholder = () => {
        const newStep: JourneyStep = {
            id: crypto.randomUUID(),
            type: 'placeholder',
            workspaceId,
            title: "Future Lecture",
            placeholderTitle: "Future Lecture",
        };
        setSteps([...steps, newStep]);
    };

    const linkPlaceholder = (stepId: string, lecture: LectureOption) => {
        setSteps(steps.map(s => s.id === stepId ? {
            ...s,
            type: 'lecture',
            lectureId: lecture.id,
            subjectId: lecture.subjectId,
            title: lecture.title,
            subjectName: lecture.subjectName,
        } : s));
        toast.success("Step linked to lecture!");
    };

    const updatePlaceholderTitle = (stepId: string, newTitle: string) => {
        setSteps(steps.map(s => s.id === stepId ? { ...s, title: newTitle, placeholderTitle: newTitle } : s));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Please enter a journey name.");
        if (steps.length === 0) return toast.error("Please add at least one lecture.");

        setSaving(true);
        try {
            const journeyData = {
                name,
                description,
                steps,
                workspaceId,
                ownerId: user?.uid,
                updatedAt: serverTimestamp(),
            };

            if (existingJourney) {
                await updateDoc(doc(db, "workspaces", workspaceId, "journeys", existingJourney.id), journeyData);
                toast.success("Journey updated!");
            } else {
                const newDoc = await addDoc(collection(db, "workspaces", workspaceId, "journeys"), {
                    ...journeyData,
                    createdAt: serverTimestamp(),
                });
                
                // Initialize creator progress
                if (user) {
                    await setDoc(doc(db, "workspaces", workspaceId, "journeys", newDoc.id, "user_progress", user.uid), {
                        currentStepIndex: 0,
                        lastUpdated: serverTimestamp(),
                    });
                }
                
                toast.success("Journey created!");
            }
            onClose();
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("Failed to save journey.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <Input
                    placeholder="Journey Name (e.g. My Finals Review)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg font-bold h-12 border-primary/20 focus:border-primary"
                />
                <Textarea
                    placeholder="Short description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none border-primary/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Lectures */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Available Lectures
                        </h4>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addPlaceholder}
                            className="h-7 text-[10px] uppercase tracking-wider font-bold border-primary/30 text-primary hover:bg-primary/5"
                        >
                            <Sparkles className="h-3 w-3 mr-1" /> Add Placeholder
                        </Button>
                    </div>
                    <Card className="bg-muted/30 border-none min-h-[200px]">
                        <CardContent className="p-3 space-y-2">
                            {loading ? (
                                <p className="text-center text-xs text-muted-foreground py-10">Loading...</p>
                            ) : availableLectures.map(lec => (
                                <div
                                    key={lec.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-background border hover:border-primary/50 transition-all group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate">{lec.title}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{lec.subjectName}</p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => addStep(lec)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Journey Steps */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Your Path
                    </h4>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="journey-steps">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="h-[400px] overflow-y-auto space-y-2 pr-2"
                                >
                                    <AnimatePresence>
                                        {steps.map((step, index) => (
                                            <Draggable key={step.id} draggableId={step.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={cn(
                                                            "flex flex-col gap-2 p-3 rounded-xl transition-all",
                                                            step.type === 'placeholder' 
                                                                ? "bg-primary/5 border-2 border-dashed border-primary/20 backdrop-blur-sm shadow-inner" 
                                                                : "bg-background border border-primary/10 shadow-sm",
                                                            snapshot.isDragging && "shadow-xl border-primary scale-[1.02] z-50 bg-background"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div {...provided.dragHandleProps}>
                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {step.type === 'placeholder' ? (
                                                                    <div className="space-y-1 group/input relative">
                                                                        <Input 
                                                                            value={step.title}
                                                                            onChange={(e) => updatePlaceholderTitle(step.id, e.target.value)}
                                                                            className="h-7 text-sm font-bold bg-transparent border-none focus-visible:ring-0 p-0 hover:bg-primary/5 transition-colors rounded px-1"
                                                                            placeholder="Enter lecture name..."
                                                                        />
                                                                        <p className="text-[10px] text-primary/60 font-medium uppercase tracking-widest flex items-center gap-1">
                                                                            <Sparkles className="h-2 w-2" /> Future Content (Click to rename)
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-sm font-bold truncate">{step.title}</p>
                                                                        <p className="text-[10px] text-primary/70 font-medium truncate uppercase tracking-wider">{step.subjectName}</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {step.type === 'placeholder' && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-7 w-7 text-primary/50 hover:text-primary hover:bg-primary/10"
                                                                            >
                                                                                <LinkIcon className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-64">
                                                                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Link to Lecture</DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            {availableLectures.length === 0 ? (
                                                                                <div className="text-center text-[10px] py-4 text-muted-foreground whitespace-normal">
                                                                                    No lectures available in this workspace yet.
                                                                                </div>
                                                                            ) : (
                                                                                <div className="max-h-60 overflow-y-auto">
                                                                                    {availableLectures.map(lec => (
                                                                                        <DropdownMenuItem
                                                                                            key={lec.id}
                                                                                            onClick={() => linkPlaceholder(step.id, lec)}
                                                                                            className="flex flex-col items-start gap-0 cursor-pointer"
                                                                                        >
                                                                                            <span className="font-semibold text-xs">{lec.title}</span>
                                                                                            <span className="text-[10px] text-muted-foreground">{lec.subjectName}</span>
                                                                                        </DropdownMenuItem>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive shrink-0"
                                                                    onClick={() => removeStep(step.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    </AnimatePresence>
                                    {provided.placeholder}
                                    {steps.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-xl border-muted opacity-50">
                                            <p className="text-sm font-medium">Drag or add lectures here</p>
                                            <p className="text-xs">Your personalized journey starts now.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2 px-8 shadow-lg shadow-primary/20">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Journey"}
                </Button>
            </div>
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
    return inputs.filter(Boolean).join(" ");
}
