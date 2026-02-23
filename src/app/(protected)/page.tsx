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
    BookOpen,
    Link2
} from "lucide-react";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import { JoinWorkspaceModal } from "@/components/workspaces/join-workspace-modal";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
    const { user } = useAuth();
    const { workspaces, loading } = useWorkspace();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [joinModalOpen, setJoinModalOpen] = useState(false);

    const [stats, setStats] = useState({
        hoursStudied: 0,
        streak: 0,
        totalSubjects: 0,
    });
    const [workspaceStats, setWorkspaceStats] = useState<Record<string, { lastActive: number, subjects: number, sessions: number }>>({});
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (workspaces.length === 0) {
            setStats({ hoursStudied: 0, streak: 0, totalSubjects: 0 });
            setWorkspaceStats({});
            setStatsLoading(false);
            return;
        }

        const fetchGlobalStats = async () => {
            setStatsLoading(true);
            let totalMins = 0;
            const allSessionDates = new Set<string>();
            let subjectsCount = 0;
            const wsStats: Record<string, { lastActive: number; subjects: number; sessions: number }> = {};

            await Promise.all(workspaces.map(async (ws) => {
                try {
                    const [sessionsSnap, subjectsSnap] = await Promise.all([
                        getDocs(collection(db, "workspaces", ws.id, "sessions")),
                        getDocs(collection(db, "workspaces", ws.id, "subjects")),
                    ]);

                    const wsDates: string[] = [];
                    sessionsSnap.docs.forEach(doc => {
                        const data = doc.data();
                        totalMins += (data.durationMinutes || 0);
                        if (data.date) {
                            allSessionDates.add(data.date);
                            wsDates.push(data.date);
                        }
                    });

                    const subCount = subjectsSnap.docs.length;
                    subjectsCount += subCount;

                    wsDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                    wsStats[ws.id] = {
                        lastActive: wsDates.length > 0 ? new Date(wsDates[0]).getTime() : (ws.createdAt?.toMillis() || Date.now()),
                        subjects: subCount,
                        sessions: sessionsSnap.docs.length
                    };
                } catch (e) {
                    console.error("Error fetching stats for ws", ws.id, e);
                }
            }));

            // Calculate streak
            let currentStreak = 0;
            for (let i = 0; i < 365; i++) {
                const checkDateStr = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
                if (allSessionDates.has(checkDateStr)) {
                    currentStreak++;
                } else if (i === 0) {
                    continue; // Missing today doesn't break the streak (yet)
                } else {
                    break;
                }
            }

            setStats({
                hoursStudied: Math.round((totalMins / 60) * 10) / 10,
                streak: currentStreak,
                totalSubjects: subjectsCount,
            });
            setWorkspaceStats(wsStats);
            setStatsLoading(false);
        };

        fetchGlobalStats();
    }, [workspaces]);

    if (loading || statsLoading) {
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
                        Your workspace is where your learning journey begins. Create one to start organizing your subjects, or join an existing workspace.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
                    <Button size="lg" onClick={() => setCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                        <Plus className="h-5 w-5" />
                        Create Workspace
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setJoinModalOpen(true)} className="gap-2 shadow-sm w-full sm:w-auto">
                        <Link2 className="h-5 w-5" />
                        Join Workspace
                    </Button>
                </div>
                <CreateWorkspaceModal
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                />
                <JoinWorkspaceModal
                    open={joinModalOpen}
                    onOpenChange={setJoinModalOpen}
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
                                <p className="text-2xl font-bold font-mono">{stats.hoursStudied}h</p>
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
                                <p className="text-2xl font-bold font-mono">{stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}</p>
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
                                <p className="text-2xl font-bold font-mono">{stats.totalSubjects}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workspaces Grid */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold">Your Workspaces</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setJoinModalOpen(true)} className="gap-2">
                            <Link2 className="h-4 w-4" />
                            Join
                        </Button>
                        <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Workspace
                        </Button>
                    </div>
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
                                        Last active: {new Date(workspaceStats[workspace.id]?.lastActive || workspace.createdAt?.toMillis() || Date.now()).toLocaleDateString()}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{workspaceStats[workspace.id]?.subjects || 0} subjects</span>
                                        <span>{workspaceStats[workspace.id]?.sessions || 0} sessions</span>
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
