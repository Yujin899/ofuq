"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lecture, QuizQuestion } from "@/types/lecture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    ChevronRight,
    Trophy,
    RotateCcw,
    XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type Step = "intro" | "timer" | "completion";
type Phase = "quiz" | "results";

const pageVariants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const TYPE_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "destructive" }> = {
    single: { label: "Single Choice", variant: "outline" },
    multi: { label: "Multiple Choice", variant: "secondary" },
    case: { label: "Clinical Case", variant: "destructive" },
};

interface AnswerRecord {
    selected: number[];
    correct: boolean;
}

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
    const { user } = useAuth();
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
    const accumulatedRef = useRef(0);
    const segmentStartRef = useRef(0);

    // Focus state
    const [focusPhase, setFocusPhase] = useState<"running" | "choosing">("running");
    const [skippedQuiz, setSkippedQuiz] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);

    // Quiz state
    const [quizPhase, setQuizPhase] = useState<Phase>("quiz");
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);

    // Completion state
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
        accumulatedRef.current = elapsed;
        setIsPaused(true);
    };

    const handleResume = () => {
        segmentStartRef.current = Date.now();
        setIsPaused(false);
        startTick();
    };

    const handleSaveWithoutQuiz = () => {
        setSkippedQuiz(true);
        handleStopSession();
    };

    const handleFinishQuizWithResults = () => {
        setSkippedQuiz(false);
        handleStopSession();
    };

    const handleStopSession = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalMs = !isPaused
            ? accumulatedRef.current + (Date.now() - segmentStartRef.current)
            : accumulatedRef.current;
        setFinalElapsed(finalMs);
        setIsPaused(true);
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
                    userId: user?.uid,
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

    // Quiz Helpers
    const quiz = lecture?.quiz || [];
    const q: QuizQuestion | undefined = quiz[currentIdx];
    const progress = quiz.length > 0 ? ((currentIdx + 1) / quiz.length) * 100 : 0;
    const isLastQuestion = quiz.length > 0 ? currentIdx === quiz.length - 1 : false;

    const toggleOption = (idx: number) => {
        if (submitted || !q) return;
        if (q.type === "multi") {
            setSelected((prev) => {
                const next = new Set(prev);
                next.has(idx) ? next.delete(idx) : next.add(idx);
                return next;
            });
        } else {
            setSelected(new Set([idx]));
        }
    };

    const handleSubmitQuiz = () => {
        if (!q) return;
        const sel = Array.from(selected).sort();
        const correct = [...q.correctAnswers].sort();
        const isCorrect = JSON.stringify(sel) === JSON.stringify(correct);
        setAnswers((prev) => [...prev, { selected: sel, correct: isCorrect }]);
        setSubmitted(true);
    };

    const handleNextQuiz = () => {
        if (isLastQuestion) {
            handleFinishQuizWithResults();
        } else {
            setCurrentIdx((i) => i + 1);
            setSelected(new Set());
            setSubmitted(false);
        }
    };

    const handleRestartQuiz = () => {
        setCurrentIdx(0);
        setSelected(new Set());
        setSubmitted(false);
        setAnswers([]);
        setQuizPhase("quiz");
    };

    const correctCount = answers.filter((a) => a.correct).length;
    const scorePercent = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;

    const getOptionStyle = (optIdx: number) => {
        if (!q) return "";
        if (!submitted) {
            return selected.has(optIdx)
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/60 hover:text-foreground";
        }
        const isCorrect = q.correctAnswers.includes(optIdx);
        const isSelected = selected.has(optIdx);
        if (isCorrect) return "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
        if (isSelected && !isCorrect) return "border-red-400 bg-red-400/10 text-red-600 dark:text-red-400";
        return "border-border bg-muted/20 text-muted-foreground";
    };

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
        <div className={cn("mx-auto pb-16", step === "timer" ? "w-full max-w-full" : "max-w-2xl")}>
            <AnimatePresence mode="wait">

                {/* ─────────── STEP 1: INTRO ─────────── */}
                {step === "intro" && (
                    <motion.div key="intro" {...pageVariants} className="space-y-6 w-full max-w-2xl mx-auto">
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

                {/* ─────────── STEP 2: ACTIVE SESSION & QUIZ ─────────── */}
                {step === "timer" && (
                    <motion.div key="timer" {...pageVariants} className="flex flex-col min-h-screen pb-24 relative -mx-4 sm:mx-0">
                        {/* Animatable Timer Block */}
                        <motion.div
                            layout
                            className={cn(
                                "transition-all duration-700 w-full mb-6 relative",
                                !showQuiz
                                    ? "flex flex-col items-center justify-center flex-1 my-auto pt-24"
                                    : "bg-background border-b pb-4 pt-4 shadow-sm px-4"
                            )}
                        >
                            <div className={cn("mx-auto flex transition-all duration-700", !showQuiz ? "flex-col items-center space-y-4" : "items-center justify-between w-full max-w-2xl")}>
                                <motion.div layout className={cn("flex items-center gap-2 text-muted-foreground", !showQuiz ? "text-sm font-medium" : "text-[10px] sm:text-xs font-bold uppercase tracking-widest shrink-0")}>
                                    <Timer className={cn("text-primary", !isPaused && "animate-pulse", !showQuiz ? "h-5 w-5" : "h-3.5 w-3.5")} />
                                    {isPaused ? "Paused" : "Focusing"}
                                </motion.div>

                                <motion.div layout className={cn("font-mono font-bold tracking-tight tabular-nums transition-all duration-700", !showQuiz ? "text-8xl mt-2" : "text-xl sm:text-2xl mt-0.5 sm:mt-0 grow", showQuiz && "ml-4")}>
                                    {formatElapsed(elapsed)}
                                </motion.div>

                                {showQuiz && (
                                    <motion.div layout className="flex gap-2 shrink-0 self-end sm:self-auto">
                                        {isPaused ? (
                                            <Button size="sm" variant="outline" onClick={handleResume} className="gap-2">
                                                <Play className="h-4 w-4" />
                                                <span className="hidden sm:inline">Resume</span>
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={handlePause} className="gap-2">
                                                <Pause className="h-4 w-4" />
                                                <span className="hidden sm:inline">Pause</span>
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={handleSaveWithoutQuiz} className="gap-1.5 shadow-sm">
                                            <Square className="h-3.5 w-3.5 fill-current" />
                                            End <span className="hidden sm:inline">& Save</span>
                                        </Button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Focus Phase Controls */}
                            {!showQuiz && (
                                <motion.div layout className="mt-12 flex flex-col gap-3 w-full max-w-xs mx-auto text-center relative z-20">
                                    {focusPhase === "running" ? (
                                        <>
                                            <h2 className="text-base font-medium text-foreground/70 mb-4">{lecture.title}</h2>
                                            {isPaused ? (
                                                <Button size="lg" onClick={handleResume} className="w-full py-6 font-semibold gap-2 shadow-lg shadow-primary/20">
                                                    <Play className="h-5 w-5" /> Resume Session
                                                </Button>
                                            ) : (
                                                <Button size="lg" variant="outline" onClick={handlePause} className="w-full py-6 font-semibold gap-2 border-primary/20 hover:bg-primary/5">
                                                    <Pause className="h-5 w-5" /> Pause Session
                                                </Button>
                                            )}
                                            <Button size="lg" variant="destructive" onClick={() => setFocusPhase("choosing")} className="w-full py-6 font-semibold gap-2 shadow-sm">
                                                <Square className="h-4 w-4 fill-current" /> End Focus
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                            <p className="text-sm text-foreground font-semibold mb-1">Time is still ticking! ⏱️</p>
                                            <p className="text-xs text-muted-foreground mb-4">Would you like to review with a quiz or just wrap up?</p>
                                            {quiz.length > 0 && (
                                                <Button size="lg" onClick={() => setShowQuiz(true)} className="w-full py-6 font-bold shadow-lg shadow-primary/20 gap-2">
                                                    <BookOpen className="h-5 w-5" />
                                                    Take Active Quiz
                                                </Button>
                                            )}
                                            <Button size="lg" variant="outline" onClick={handleSaveWithoutQuiz} className="w-full py-6 font-semibold gap-2 border-primary/20 hover:bg-green-500/5 hover:text-green-600 dark:hover:text-green-400">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Save Session & Dashboard
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setFocusPhase("running")} className="w-full mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                                                Nevermind, back to focus
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Integrated Quiz Content */}
                        <div className="max-w-2xl mx-auto w-full px-4 sm:px-0 flex-1">
                            {showQuiz && q && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                                <span>QUESTION {currentIdx + 1} OF {quiz.length}</span>
                                            </div>
                                            <Progress value={progress} className="h-1.5" />
                                        </div>
                                    </div>

                                    {/* Question Card */}
                                    <Card className="border-none shadow-sm bg-card/50">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <Badge variant={TYPE_BADGE[q.type].variant} className="shrink-0 text-[10px]">
                                                    {TYPE_BADGE[q.type].label}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg font-medium leading-relaxed mt-2">
                                                {q.question}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {q.options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleOption(i)}
                                                    disabled={submitted}
                                                    className={cn(
                                                        "w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-all duration-150",
                                                        getOptionStyle(i),
                                                        !submitted && "cursor-pointer"
                                                    )}
                                                >
                                                    <span className="font-mono text-[11px] opacity-60 shrink-0 mt-0.5">
                                                        {String.fromCharCode(65 + i)}.
                                                    </span>
                                                    <span className="leading-relaxed">{opt}</span>
                                                    {submitted && q.correctAnswers.includes(i) && (
                                                        <CheckCircle2 className="h-4 w-4 ml-auto shrink-0 text-green-500 mt-0.5" />
                                                    )}
                                                    {submitted && selected.has(i) && !q.correctAnswers.includes(i) && (
                                                        <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-400 mt-0.5" />
                                                    )}
                                                </button>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Explanation */}
                                    {submitted && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                                                answers[answers.length - 1]?.correct
                                                    ? "border-green-400/40 bg-green-500/5 text-green-700 dark:text-green-400/90"
                                                    : "border-red-400/40 bg-red-500/5 text-red-700 dark:text-red-400/90"
                                            )}
                                        >
                                            <p className="font-semibold mb-1">
                                                {answers[answers.length - 1]?.correct ? "✓ Correct!" : "✗ Not quite."}
                                            </p>
                                            <p className="text-foreground/80">{q.explanation}</p>
                                        </motion.div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        {!submitted ? (
                                            <Button
                                                onClick={handleSubmitQuiz}
                                                disabled={selected.size === 0}
                                                className="flex-1 py-6 font-semibold shadow-md"
                                            >
                                                Submit Answer
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleNextQuiz}
                                                className="flex-1 py-6 font-semibold gap-2 shadow-md hover:translate-x-1 transition-transform"
                                            >
                                                {isLastQuestion ? "See Quiz Results" : "Next Question"}
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ─────────── STEP 3: COMPLETION ─────────── */}
                {step === "completion" && (
                    <motion.div key="completion" {...pageVariants} className="flex flex-col items-center justify-center min-h-[75vh] space-y-8 text-center max-w-2xl mx-auto w-full px-4 sm:px-0">
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
                            <p className="text-xs font-medium text-muted-foreground mt-2">
                                {Math.max(1, Math.round(finalElapsed / 60000))} minutes officially logged to your dashboard.
                            </p>
                        </div>

                        {!skippedQuiz && quiz.length > 0 && (
                            <Card className="w-full max-w-sm mx-auto shadow-sm border-dashed bg-muted/20">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-muted-foreground">Quiz Score</span>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        <span className="font-bold">{scorePercent}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                            <Button
                                className="w-full py-6 font-semibold shadow-md gap-2"
                                onClick={() => router.push(`/workspaces/${workspaceId}`)}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Return to Dashboard
                            </Button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div >
    );
}
