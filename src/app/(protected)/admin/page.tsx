"use client";

import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCoreSubjects, createCoreSubject, updateCoreSubject, deleteCoreSubject, CoreSubject } from "@/lib/firebase/core-subjects";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
    const { user, loading } = useAuth();

    const [subjects, setSubjects] = useState<CoreSubject[]>([]);
    const [fetchingSubjects, setFetchingSubjects] = useState(true);

    const [newSubjectName, setNewSubjectName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (!loading && user?.role === "admin") {
            loadSubjects();
        }
    }, [user, loading]);

    const loadSubjects = async () => {
        setFetchingSubjects(true);
        try {
            const data = await getCoreSubjects();
            // Sort alphabetically
            data.sort((a, b) => a.name.localeCompare(b.name));
            setSubjects(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load core subjects.");
        } finally {
            setFetchingSubjects(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        redirect("/");
    }

    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        setIsAdding(true);
        try {
            await createCoreSubject(newSubjectName.trim());
            toast.success("Subject added!");
            setNewSubjectName("");
            loadSubjects();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add subject");
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateSubject = async (id: string) => {
        if (!editName.trim()) return;
        try {
            await updateCoreSubject(id, editName.trim());
            toast.success("Subject updated!");
            setEditingId(null);
            loadSubjects();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update subject");
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm("Are you sure you want to delete this global core subject? It will not affect existing workspaces, but new ones won't see it.")) return;
        try {
            await deleteCoreSubject(id);
            toast.success("Subject deleted!");
            loadSubjects();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete subject");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">System management and utilities.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Core Subjects</CardTitle>
                            <CardDescription>
                                Manage the default subjects given to users upon workspace creation.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add New */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="New core subject name..."
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddSubject();
                                }}
                            />
                            <Button onClick={handleAddSubject} disabled={isAdding || !newSubjectName.trim()}>
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                Add
                            </Button>
                        </div>

                        {/* List */}
                        <div className="rounded-md border divide-y overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                            {fetchingSubjects ? (
                                <div className="p-8 flex justify-center text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : subjects.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No core subjects found. Use the seeding tool or add one manually.
                                </div>
                            ) : (
                                subjects.map((subject) => (
                                    <div key={subject.id} className="flex items-center justify-between p-3 bg-card hover:bg-accent/30 transition-colors">
                                        {editingId === subject.id ? (
                                            <div className="flex items-center gap-2 flex-1 mr-4">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 text-sm font-medium"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateSubject(subject.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 focus:text-green-600" onClick={() => handleUpdateSubject(subject.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{subject.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{subject.id}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => {
                                                            setEditingId(subject.id);
                                                            setEditName(subject.name);
                                                        }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDeleteSubject(subject.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
