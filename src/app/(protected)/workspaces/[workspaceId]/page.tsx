"use client";

import { useWorkspace } from "@/hooks/use-workspace";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudyActivityChart, RawSession } from "@/components/dashboard/study-activity-chart";
import { DailyGoalChart } from "@/components/dashboard/daily-goal-chart";
import { SubjectTimeChart, TimePerSubjectDataPoint } from "@/components/dashboard/subject-time-chart";
import { QuizPerformanceChart, QuizPerformanceDataPoint } from "@/components/dashboard/quiz-performance-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Share2 } from "lucide-react";
import { ShareWorkspaceDialog } from "@/components/workspaces/share-workspace-dialog";
import { useAuth } from "@/hooks/use-auth";

interface SessionDoc {
    subjectId: string;
    lectureId: string;
    durationMinutes: number;
    date: string;
    quizScore?: number;
    totalQuestions?: number;
    scorePercent?: number;
}

const DAILY_GOAL_MINUTES = 120;

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const { workspaces, setActiveWorkspace } = useWorkspace();
    const { user } = useAuth();
    const workspaceId = params.workspaceId as string;
    const workspace = workspaces.find((w: { id: string }) => w.id === workspaceId);

    const [sessions, setSessions] = useState<SessionDoc[]>([]);
    const [subjectNames, setSubjectNames] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        if (workspace) setActiveWorkspace(workspace);
    }, [workspace, setActiveWorkspace]);

    useEffect(() => {
        if (!workspaceId || !user?.uid) return;
        const fetchAll = async () => {
            const [sessionsSnap, subjectsSnap] = await Promise.all([
                getDocs(query(collection(db, "workspaces", workspaceId, "sessions"), where("userId", "==", user.uid))),
                getDocs(collection(db, "workspaces", workspaceId, "subjects")),
            ]);
            setSessions(sessionsSnap.docs.map((d) => d.data() as SessionDoc));
            setSubjectNames(
                new Map(subjectsSnap.docs.map((d) => [d.id, (d.data().name as string) ?? d.id]))
            );
            setLoading(false);
        };
        fetchAll();
    }, [workspaceId, user?.uid]);

    // ── Raw sessions for activity chart ──
    const rawSessions: RawSession[] = sessions.map((s) => ({
        date: s.date,
        durationMinutes: s.durationMinutes,
        subjectId: s.subjectId,
    }));

    // ── Subject Time (resolved names) ──
    const subjectMinutes = new Map<string, number>();
    sessions.forEach((s) =>
        subjectMinutes.set(s.subjectId, (subjectMinutes.get(s.subjectId) || 0) + (s.durationMinutes || 0))
    );
    const subjectData: TimePerSubjectDataPoint[] = Array.from(subjectMinutes.entries()).map(([id, minutes]) => ({
        subject: subjectNames.get(id) ?? id,
        minutes,
    }));

    // ── Quiz Performance per subject ──
    const quizStats = new Map<string, { totalScore: number; count: number }>();
    sessions.forEach((s) => {
        if (s.scorePercent !== undefined) {
            const current = quizStats.get(s.subjectId) || { totalScore: 0, count: 0 };
            quizStats.set(s.subjectId, {
                totalScore: current.totalScore + s.scorePercent,
                count: current.count + 1,
            });
        }
    });

    const quizPerformanceData: QuizPerformanceDataPoint[] = Array.from(quizStats.entries()).map(([id, stat]) => ({
        subject: subjectNames.get(id) ?? id,
        score: Math.round(stat.totalScore / stat.count),
    }));

    // ── Daily Goal ──
    const today = new Date().toISOString().split("T")[0];
    const studiedToday = sessions
        .filter((s) => s.date === today)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const achievedPercent = Math.min(100, Math.round((studiedToday / DAILY_GOAL_MINUTES) * 100));

    if (!workspace) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-muted-foreground">Workspace not found.</p>
                <Button variant="outline" onClick={() => router.push("/")}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">{workspace.name}</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Analytics and overview for this workspace.
                    </p>
                </div>
                {workspace.role === "owner" && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsShareOpen(true)}
                        className="flex items-center gap-2 w-full sm:w-auto"
                    >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                    </Button>
                )}
            </div>

            <ShareWorkspaceDialog
                workspaceId={workspaceId}
                open={isShareOpen}
                onOpenChange={setIsShareOpen}
            />

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="md:col-span-2"><Skeleton className="h-[340px] w-full rounded-xl" /></div>
                    <div className="md:col-span-1"><Skeleton className="h-[340px] w-full rounded-xl" /></div>
                    <div className="md:col-span-1"><Skeleton className="h-[320px] w-full rounded-xl" /></div>
                    <div className="md:col-span-2"><Skeleton className="h-[320px] w-full rounded-xl" /></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Row 1: Activity (wide) + Daily Goal (narrow) */}
                    <div className="min-w-0 md:col-span-2">
                        <StudyActivityChart sessions={rawSessions} />
                    </div>
                    <div className="min-w-0 md:col-span-1">
                        <DailyGoalChart
                            achievedPercent={achievedPercent}
                            goalMinutes={DAILY_GOAL_MINUTES}
                            studiedMinutes={studiedToday}
                        />
                    </div>
                    {/* Row 2: Time Allocation + Session Count side by side */}
                    <div className="min-w-0 md:col-span-1">
                        <SubjectTimeChart data={subjectData} />
                    </div>
                    <div className="min-w-0 md:col-span-2">
                        <QuizPerformanceChart data={quizPerformanceData} />
                    </div>
                </div>
            )}
        </div>
    );
}
