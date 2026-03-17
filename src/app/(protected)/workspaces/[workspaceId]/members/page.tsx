"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { usePresence } from "@/hooks/use-presence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Trophy, Users, Clock, BookCheck, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MemberStats {
    uid: string;
    displayName: string;
    email: string;
    hours: number;
    avgQuizScore: number;
    lecturesCompleted: number;
    score: number;
}

export default function WorkspaceMembersPage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const { workspaces } = useWorkspace();
    const workspace = workspaces.find((w: { id: string }) => w.id === workspaceId);
    const { presenceData: onlineUsers } = usePresence();

    const [membersStats, setMembersStats] = useState<MemberStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workspace) return;

        const fetchStats = async () => {
            setLoading(true);
            try {
                const memberIds = workspace.memberIds || [];
                // Include owner if not in memberIds
                const allUids = Array.from(new Set([...memberIds, workspace.ownerId]));

                const stats: MemberStats[] = [];

                await Promise.all(allUids.map(async (uid) => {
                    // Fetch user info
                    const userSnap = await getDoc(doc(db, "users", uid));
                    const userData = userSnap.data();

                    // Fetch all sessions for this user in this workspace
                    const q = query(
                        collection(db, "workspaces", workspaceId, "sessions"),
                        where("userId", "==", uid)
                    );
                    const sessionsSnap = await getDocs(q);
                    const sessions = sessionsSnap.docs.map(d => d.data());

                    let totalMins = 0;
                    let totalQuizScore = 0;
                    let quizCount = 0;
                    const completedLectures = new Set<string>();

                    sessions.forEach(s => {
                        totalMins += (s.durationMinutes || 0);
                        if (s.scorePercent !== undefined) {
                            totalQuizScore += s.scorePercent;
                            quizCount++;
                        }
                        if (s.lectureId) completedLectures.add(s.lectureId);
                    });

                    const hours = Math.round((totalMins / 60) * 10) / 10;
                    const avgQuizScore = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0;
                    const lecturesCompleted = completedLectures.size;

                    // Composite Score: (Hours * 10) + (Avg Quiz * 0.5) + (Completed * 5)
                    const score = Math.round((hours * 10) + (avgQuizScore * 0.5) + (lecturesCompleted * 5));

                    stats.push({
                        uid,
                        displayName: userData?.displayName || userData?.email?.split("@")[0] || "Student",
                        email: userData?.email || "",
                        hours,
                        avgQuizScore,
                        lecturesCompleted,
                        score
                    });
                }));

                // Sort by score descending
                stats.sort((a, b) => b.score - a.score);
                setMembersStats(stats);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [workspace, workspaceId]);

    if (!workspace) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Workspace
                </Button>
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Community & Leaderboard</h1>
                </div>
                <p className="text-muted-foreground">
                    Connect with your study group and track your collective progress.
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6">
                    {/* Top 3 Podium (Optional but nice) */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {membersStats.slice(0, 3).map((member, i) => (
                            <Card key={member.uid} className={cn(
                                "relative overflow-hidden border-none shadow-sm",
                                i === 0 ? "bg-primary/10 ring-2 ring-primary/20" : "bg-muted/30"
                            )}>
                                <CardContent className="pt-6 text-center space-y-2">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-background flex items-center justify-center border-2 border-primary/20 shadow-inner overflow-hidden relative">
                                        <span className="text-lg font-black text-primary">{member.displayName[0]}</span>
                                        {onlineUsers[member.uid] && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold truncate">{member.displayName}</p>
                                        <div className="flex items-center justify-center gap-1 text-primary">
                                            <Trophy className="h-3.5 w-3.5" />
                                            <span className="text-sm font-bold">{member.score} pts</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-10">
                                        <Star className="h-12 w-12 fill-primary stroke-none" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Full List */}
                    <Card className="border-none shadow-sm bg-muted/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Rankings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-primary/5">
                                <AnimatePresence>
                                    {membersStats.map((member, index) => (
                                        <motion.div
                                            key={member.uid}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors group"
                                        >
                                            <div className="w-8 text-center font-mono font-bold text-muted-foreground/50 group-hover:text-primary transition-colors">
                                                #{index + 1}
                                            </div>
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-sm font-black text-primary shadow-sm">
                                                    {member.displayName[0]}
                                                </div>
                                                {onlineUsers[member.uid] && (
                                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate group-hover:text-primary transition-colors">{member.displayName}</p>
                                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-medium">Student</p>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5 min-w-[70px]">
                                                    <Clock className="h-3.5 w-3.5 text-secondary" />
                                                    {member.hours}h
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-[70px]">
                                                    <BookCheck className="h-3.5 w-3.5 text-primary/70" />
                                                    {member.avgQuizScore}%
                                                </div>
                                            </div>
                                            <div className="text-right min-w-[60px]">
                                                <p className="text-sm font-black text-primary">{member.score}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Score</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
