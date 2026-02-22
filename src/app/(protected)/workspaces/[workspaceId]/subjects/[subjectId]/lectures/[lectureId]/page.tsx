"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lecture } from "@/types/lecture";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ChevronLeft,
    Languages,
    Timer,
    CheckCircle2,
    LayoutDashboard,
    BookOpen,
    Pause,
    Play,
    Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Step = "intro" | "timer" | "completion";

const pageVariants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" as const } },
};

function formatElapsed(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LecturePage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const subjectId = params.subjectId as string;
    const lectureId = params.lectureId as string;

    const [lecture, setLecture] = useState<Lecture | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<Step>("intro");
    const [showArabic, setShowArabic] = useState(false);

    // Timer state
    const [elapsed, setElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Accumulated elapsed ms before the latest resume
    const accumulatedRef = useRef(0);
    // Timestamp of latest segment start (set on start or resume)
    const segmentStartRef = useRef(0);

    // Completion
    const [sessionSaved, setSessionSaved] = useState(false);
    const [finalElapsed, setFinalElapsed] = useState(0);

    useEffect(() => {
        if (!workspaceId || !subjectId || !lectureId) return;
        const fetchLecture = async () => {
            const ref = doc(db, "workspaces", workspaceId, "subjects", subjectId, "lectures", lectureId);
            const snap = await getDoc(ref);
            if (snap.exists()) setLecture({ id: snap.id, ...snap.data() } as Lecture);
            setLoading(false);
        };
        fetchLecture();
    }, [workspaceId, subjectId, lectureId]);

    // Tick interval
    const startTick = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            const segmentElapsed = Date.now() - segmentStartRef.current;
            setElapsed(accumulatedRef.current + segmentElapsed);
        }, 500);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const handleStartStudying = () => {
        accumulatedRef.current = 0;
        segmentStartRef.current = Date.now();
        localStorage.setItem("startTime", segmentStartRef.current.toString());
        setElapsed(0);
        setIsPaused(false);
        setStep("timer");
        startTick();
    };

    const handlePause = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Freeze accumulated
        accumulatedRef.current = elapsed;
        setIsPaused(true);
    };

    const handleResume = () => {
        segmentStartRef.current = Date.now();
        setIsPaused(false);
        startTick();
    };

    const handleStopSession = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Capture final: if running, add current segment
        const finalMs = !isPaused
            ? accumulatedRef.current + (Date.now() - segmentStartRef.current)
            : accumulatedRef.current;
        setFinalElapsed(finalMs);
        setStep("completion");
    };

    // Save session on entering completion
    useEffect(() => {
        if (step !== "completion" || sessionSaved) return;
        const saveSession = async () => {
            try {
                const durationMinutes = Math.max(1, Math.round(finalElapsed / 60000));
                await addDoc(collection(db, "workspaces", workspaceId, "sessions"), {
                    subjectId,
                    lectureId,
                    durationMinutes,
                    date: new Date().toISOString().split("T")[0],
                    createdAt: serverTimestamp(),
                });
                setSessionSaved(true);
            } catch {
                toast.error("Could not save session. Please try again.");
            }
        };
        saveSession();
    }, [step, sessionSaved, workspaceId, subjectId, lectureId, finalElapsed]);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pt-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-72" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!lecture) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
                <p className="text-muted-foreground">Lecture not found.</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-16">
            <AnimatePresence mode="wait">

                {/* ─────────── STEP 1: INTRO ─────────── */}
                {step === "intro" && (
                    <motion.div key="intro" {...pageVariants} className="space-y-6">
                        <div className="space-y-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Back to Subjects
                            </Button>
                            <div className="flex items-start gap-3">
                                <BookOpen className="h-7 w-7 text-primary mt-1 shrink-0" />
                                <h1 className="text-2xl font-bold tracking-tight leading-tight">{lecture.title}</h1>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm bg-muted/30">
                            <CardContent className="pt-6 space-y-4">
                                <div
                                    className={cn("space-y-4 transition-all duration-300", showArabic && "text-right")}
                                    dir={showArabic ? "rtl" : "ltr"}
                                >
                                    {(showArabic ? lecture.intro.ar : lecture.intro.en)
                                        .split("\n\n")
                                        .filter(Boolean)
                                        .map((para, i) => (
                                            <p key={i} className="text-sm text-foreground/90 leading-7">{para}</p>
                                        ))}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowArabic((v) => !v)}
                                        className="gap-2 h-8 text-xs"
                                    >
                                        <Languages className="h-3.5 w-3.5" />
                                        {showArabic ? "Switch to English" : "اقرا بالعربي"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={handleStartStudying}
                            className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20"
                        >
                            Start Studying →
                        </Button>
                    </motion.div>
                )}

                {/* ─────────── STEP 2: FOCUS TIMER ─────────── */}
                {step === "timer" && (
                    <motion.div key="timer" {...pageVariants} className="flex flex-col items-center justify-center min-h-[75vh] space-y-10 text-center">
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium">
                                <Timer className={cn("h-4 w-4 text-primary", !isPaused && "animate-pulse")} />
                                {isPaused ? "Session Paused" : "Focus Session"}
                            </div>
                            <h2 className="text-base font-medium text-foreground/70">{lecture.title}</h2>
                        </div>

                        <div className="space-y-2">
                            <motion.p
                                key={isPaused ? "paused" : "running"}
                                className={cn(
                                    "text-8xl font-mono font-bold tracking-tight tabular-nums transition-colors",
                                    isPaused ? "text-muted-foreground" : "text-foreground"
                                )}
                            >
                                {formatElapsed(elapsed)}
                            </motion.p>
                            <p className="text-xs text-muted-foreground">
                                {isPaused ? "timer paused — press resume to continue" : "time elapsed"}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            {isPaused ? (
                                <Button
                                    size="lg"
                                    onClick={handleResume}
                                    className="w-full py-5 gap-2 font-semibold"
                                >
                                    <Play className="h-4 w-4" />
                                    Resume Session
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handlePause}
                                    className="w-full py-5 gap-2 font-semibold"
                                >
                                    <Pause className="h-4 w-4" />
                                    Pause Session
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                size="lg"
                                onClick={handleStopSession}
                                className="w-full py-5 gap-2 font-semibold"
                            >
                                <Square className="h-4 w-4 fill-current" />
                                End & Save Session
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* ─────────── STEP 3: COMPLETION ─────────── */}
                {step === "completion" && (
                    <motion.div key="completion" {...pageVariants} className="flex flex-col items-center justify-center min-h-[75vh] space-y-8 text-center">
                        <div className="space-y-4">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                <CheckCircle2 className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Session Complete!</h2>
                            <p className="text-muted-foreground text-sm">
                                You studied <strong className="text-foreground">{lecture.title}</strong> for
                            </p>
                            <p className="text-5xl font-mono font-bold tabular-nums text-primary">
                                {formatElapsed(finalElapsed)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {Math.max(1, Math.round(finalElapsed / 60000))} min logged to your dashboard.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <Button
                                className="w-full gap-2"
                                onClick={() => router.push(`/workspaces/${workspaceId}/subjects/${subjectId}/lectures/${lectureId}/quiz`)}
                            >
                                Take Quiz
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => router.push(`/workspaces/${workspaceId}`)}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Return to Dashboard
                            </Button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
