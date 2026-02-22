"use client";

import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, ChevronRight, FileJson, Loader2 } from "lucide-react";
import Link from "next/link";
import { Lecture } from "@/types/lecture";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SubjectWithLectures {
    id: string;
    name: string;
    lectures: Lecture[];
}

export default function SubjectsPage() {
    const router = useRouter();
    const { workspaceId } = useParams() as { workspaceId: string };
    const { activeWorkspace } = useWorkspace();
    const [subjects, setSubjects] = useState<SubjectWithLectures[]>([]);
    const [loading, setLoading] = useState(true);

    const [newSubjectName, setNewSubjectName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!workspaceId) return;

        // Query subjects as a subcollection of this workspace
        const subjectsQuery = query(
            collection(db, "workspaces", workspaceId, "subjects"),
            orderBy("name", "asc")
        );

        const unsubscribeSubjects = onSnapshot(subjectsQuery, (snapshot) => {
            const subjectData = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                lectures: []
            }));

            // Fetch lectures for each subject
            // Note: In a production app, we might want a more optimized way to fetch this,
            // but for MVP this is clear and reactive.
            const unsubscribes: (() => void)[] = [];

            subjectData.forEach((subject) => {
                const lecturesQuery = query(
                    collection(db, "workspaces", workspaceId, "subjects", subject.id, "lectures"),
                    orderBy("createdAt", "desc")
                );

                const unsub = onSnapshot(lecturesQuery, (lectureSnap) => {
                    const lectures = lectureSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Lecture));

                    setSubjects(prev => {
                        const newSubjects = [...prev];
                        const subIndex = newSubjects.findIndex(s => s.id === subject.id);
                        if (subIndex !== -1) {
                            newSubjects[subIndex].lectures = lectures;
                        } else if (newSubjects.length < subjectData.length) {
                            // Initial load
                            newSubjects.push({ ...subject, lectures });
                        }
                        return newSubjects;
                    });
                });
                unsubscribes.push(unsub);
            });

            if (snapshot.docs.length === 0) {
                setSubjects([]);
            }
            setLoading(false);

            return () => {
                unsubscribes.forEach(unsub => unsub());
            };
        });

        return () => unsubscribeSubjects();
    }, [workspaceId]);

    const handleAddLecture = (subjectId: string) => {
        router.push(`/workspaces/${workspaceId}/subjects/${subjectId}/add-lecture`);
    };

    const handleAddSubject = async () => {
        if (!newSubjectName.trim() || !workspaceId) return;
        setIsAdding(true);
        try {
            const subjectId = newSubjectName.trim().toLowerCase().replace(/\s+/g, '-');
            const docRef = doc(db, "workspaces", workspaceId, "subjects", subjectId);
            await setDoc(docRef, {
                name: newSubjectName.trim(),
                createdAt: new Date(),
                workspaceId
            });
            toast.success("Custom subject created!");
            setNewSubjectName("");
        } catch (error) {
            console.error("Failed to create subject:", error);
            toast.error("Failed to create subject.");
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-6">
                    {[1, 2].map(i => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (subjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center animate-in fade-in">
                <div className="p-4 rounded-full bg-accent/50 text-muted-foreground">
                    <BookOpen className="h-12 w-12" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">No subjects yet</h2>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        You don&apos;t have any subjects in this workspace yet. Create one to get started!
                    </p>
                </div>

                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                        placeholder="e.g. Calculus 101"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubject();
                        }}
                    />
                    <Button onClick={handleAddSubject} disabled={isAdding || !newSubjectName.trim()}>
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subjects & Lectures</h2>
                    <p className="text-muted-foreground">
                        Manage your study materials for {activeWorkspace?.name}.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Input
                        placeholder="New subject name..."
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="w-full sm:w-[200px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubject();
                        }}
                    />
                    <Button onClick={handleAddSubject} disabled={isAdding || !newSubjectName.trim()} size="sm">
                        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Add
                    </Button>
                </div>
            </div>

            <div className="grid gap-8">
                {subjects.map((subject) => (
                    <div key={subject.id} className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                {subject.name}
                            </h3>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddLecture(subject.id)}
                                className="gap-2 h-8"
                            >
                                <Plus className="h-4 w-4" />
                                Add Lecture
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {subject.lectures.map((lecture) => (
                                <Link
                                    key={lecture.id}
                                    href={`/workspaces/${workspaceId}/subjects/${subject.id}/lectures/${lecture.id}`}
                                    className="group"
                                >
                                    <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">
                                                {lecture.title}
                                            </CardTitle>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                                                {lecture.intro.en}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                                                    <FileJson className="h-3 w-3" />
                                                    Study Loop
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(lecture.createdAt?.toMillis()).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}

                            {subject.lectures.length === 0 && (
                                <div
                                    onClick={() => handleAddLecture(subject.id)}
                                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent/20 hover:border-accent transition-all min-h-[140px]"
                                >
                                    <Plus className="h-6 w-6 text-muted-foreground mb-2" />
                                    <p className="text-xs font-medium text-muted-foreground">Add your first lecture</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
