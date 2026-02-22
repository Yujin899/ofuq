"use client";

import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Layout,
    ChevronRight,
    Clock,
    Flame,
    BookOpen
} from "lucide-react";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();
    const { workspaces, loading } = useWorkspace();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (workspaces.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="p-4 rounded-full bg-primary/10">
                    <Layout className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Welcome to Ofuq{user?.displayName ? `, ${user.displayName}` : ""}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                        Your workspace is where your learning journey begins. Create one to start organizing your subjects.
                    </p>
                </div>
                <Button size="lg" onClick={() => setCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-5 w-5" />
                    Create Your First Workspace
                </Button>
                <CreateWorkspaceModal
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hub Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
                </h2>
                <p className="text-muted-foreground">
                    Your learning hub. Select a workspace to continue your progress.
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Hours Studied</p>
                                <p className="text-2xl font-bold font-mono">24.5h</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-500/5 border-orange-500/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                                <Flame className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                                <p className="text-2xl font-bold font-mono">12 Days</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                                <p className="text-2xl font-bold font-mono">{workspaces.length * 6}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workspaces Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Your Workspaces</h3>
                    <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Workspace
                    </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {workspaces.map((workspace) => (
                        <Link key={workspace.id} href={`/workspaces/${workspace.id}`} className="group">
                            <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                                        {workspace.name}
                                    </CardTitle>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">
                                        Last active: {new Date(workspace.createdAt?.toMillis()).toLocaleDateString()}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 rounded-full bg-accent">
                                            <div className="h-full w-2/3 rounded-full bg-primary" />
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground">67%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            <CreateWorkspaceModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            />
        </div>
    );
}
