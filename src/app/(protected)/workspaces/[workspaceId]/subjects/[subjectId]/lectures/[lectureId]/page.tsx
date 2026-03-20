"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, FieldValue, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TelegramBanner } from "@/components/timer/telegram-banner";
import { Lecture, QuizQuestion } from "@/types/lecture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    XCircle,
    Settings2,
    BrainCircuit,
    EyeOff,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type Step = "intro" | "pre-quiz" | "timer" | "completion";
type PomodoroMode = "settings" | "focus" | "break";

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
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
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

    const searchParams = useSearchParams();
    const journeyIdParam = searchParams.get("journeyId");
    const stepIndexParam = searchParams.get("stepIndex");

    // Pre-quiz state
    const [showHintParams, setShowHintParams] = useState<Set<number>>(new Set());

    // Pomodoro Timer state
    const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("settings");
    const [focusLength, setFocusLength] = useState<string>("25");
    const [breakLength, setBreakLength] = useState<string>("5");
    const [timeRemaining, setTimeRemaining] = useState(0); 
    const [pomodoroCount, setPomodoroCount] = useState(1);
    const [isRunning, setIsRunning] = useState(false);
    const [telegramChatId, setTelegramChatId] = useState<string | null>(null);

    // Track total focus time for saving to dashboard at the end
    const accumulatedFocusRef = useRef(0);
    const endTimeRef = useRef(0);

    // Focus state (choosing whether to take quiz or just save)
    const [focusPhase, setFocusPhase] = useState<"running" | "choosing">("running");
    const [skippedQuiz, setSkippedQuiz] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);

    // Quiz state
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);

    // Completion state
    const [sessionSaved, setSessionSaved] = useState(false);
    const [finalElapsed, setFinalElapsed] = useState(0);
    const [celebrate, setCelebrate] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setTelegramChatId(docSnap.data().telegramChatId || null);
            }
        });
        return () => unsub();
    }, [user]);

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

    // Request Notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const sendNotification = useCallback(async (title: string, body: string, type?: "work_end" | "break_end", mins?: number) => {
        // 1. Browser/Web Notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body });
        } else {
            toast(title, { description: body, duration: 8000 });
        }

        // 2. Telegram Notification
        if (telegramChatId) {
            try {
                await fetch("/api/telegram/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chatId: telegramChatId,
                        type: type || "work_end",
                        sessionNumber: pomodoroCount,
                        minutes: mins || 25
                    })
                });
            } catch (error) {
                console.error("Failed to send Telegram notification:", error);
            }
        }
    }, [telegramChatId, pomodoroCount]);

    // Pomodoro Countdown Logic
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = endTimeRef.current - now;
            
            if (remaining <= 0) {
                setTimeRemaining(0);
                setIsRunning(false);
                
                // Transition logic
                if (pomodoroMode === "focus") {
                    // Start Break automatically
                    accumulatedFocusRef.current += (parseFloat(focusLength) || 25) * 60000;
                    setPomodoroMode("break");
                    const nextTime = (parseFloat(breakLength) || 5) * 60000;
                    setTimeRemaining(nextTime);
                    endTimeRef.current = Date.now() + nextTime;
                    setIsRunning(true); // auto-start break
                    sendNotification("ofuq — Break Time! 🧠", `Great focus session. Rest for ${breakLength} minutes.`, "work_end", parseFloat(focusLength));
                } else if (pomodoroMode === "break") {
                    // Back to settings waiting for next
                    setPomodoroMode("settings");
                    setPomodoroCount(c => c + 1);
                    sendNotification("ofuq — Back to Work! 🔥", `Break's over. Ready for session ${pomodoroCount + 1}?`, "break_end", parseFloat(breakLength));
                }
            } else {
                setTimeRemaining(remaining);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isRunning, pomodoroMode, focusLength, breakLength, pomodoroCount]);


    const handleStartStudying = () => {
        if (lecture?.pre_quiz && lecture.pre_quiz.length > 0) {
            setStep("pre-quiz");
        } else {
            setStep("timer");
        }
    };

    const handleStartTimer = () => {
        const fMins = parseFloat(focusLength) || 25;
        const ms = fMins * 60000;
        setPomodoroMode("focus");
        setTimeRemaining(ms);
        endTimeRef.current = Date.now() + ms;
        setIsRunning(true);

        // Request permission again just in case it's first interaction
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleResume = () => {
        endTimeRef.current = Date.now() + timeRemaining;
        setIsRunning(true);
    };

    const handleReset = () => {
        setIsRunning(false);
        setPomodoroMode("settings");
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
        setIsRunning(false);
        if (pomodoroMode === "focus") {
            const fMins = parseFloat(focusLength) || 25;
            const focusedSoFar = (fMins * 60000) - timeRemaining;
            accumulatedFocusRef.current += Math.max(0, focusedSoFar);
        }
        setFinalElapsed(accumulatedFocusRef.current);
        setStep("completion");
    };

    const togglePreQuizHint = (idx: number) => {
        setShowHintParams(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    // Save session on entering completion
    useEffect(() => {
        if (step !== "completion" || sessionSaved) return;
        const saveSession = async () => {
            try {
                const durationMinutes = Math.max(1, Math.round(finalElapsed / 60000));
                const currentQuiz = lecture?.quiz || [];
                const correctCount = answers.filter((a) => a.correct).length;
                const scorePercent = currentQuiz.length > 0 ? Math.round((correctCount / currentQuiz.length) * 100) : 0;

                const sessionData: Record<string, string | number | undefined | FieldValue> = {
                    subjectId,
                    lectureId,
                    userId: user?.uid,
                    durationMinutes,
                    date: new Date().toISOString().split("T")[0],
                    createdAt: serverTimestamp(),
                };

                if (!skippedQuiz && currentQuiz.length > 0) {
                    sessionData.quizScore = correctCount;
                    sessionData.totalQuestions = currentQuiz.length;
                    sessionData.scorePercent = scorePercent;
                }

                await addDoc(collection(db, "workspaces", workspaceId, "sessions"), sessionData);

                // Auto-Progression Logic
                if (journeyIdParam && stepIndexParam && scorePercent >= 60 && user) {
                    const stepIndex = parseInt(stepIndexParam);
                    const progressRef = doc(db, "workspaces", workspaceId, "journeys", journeyIdParam, "user_progress", user.uid);
                    
                    const pSnap = await getDoc(progressRef);
                    const currentProgress = pSnap.exists() ? pSnap.data().currentStepIndex || 0 : 0;

                    if (stepIndex === currentProgress) {
                        await setDoc(progressRef, {
                            currentStepIndex: stepIndex + 1,
                            lastUpdated: serverTimestamp(),
                        }, { merge: true });
                        setCelebrate(true);
                        toast.success("Progress Saved! You've unlocked the next horizon! 🚀", {
                            className: "rounded-2xl border-primary/10",
                        });
                    }
                }

                setSessionSaved(true);
            } catch (err) {
                console.error("Save Error:", err);
                toast.error("Could not save session. Please try again.");
            }
        };
        saveSession();
    }, [step, sessionSaved, workspaceId, subjectId, lectureId, finalElapsed, user, skippedQuiz, lecture?.quiz, answers, journeyIdParam, stepIndexParam]);

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
                if (next.has(idx)) {
                    next.delete(idx);
                } else {
                    next.add(idx);
                }
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
        if (isCorrect) return "border-green-500 bg-green-500/10 text-green-700 md:text-green-500";
        if (isSelected && !isCorrect) return "border-red-400 bg-red-400/10 text-red-600 md:text-red-500";
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
                    <motion.div key="intro" {...pageVariants} className="space-y-6 w-full max-w-2xl mx-auto pt-6 px-4 sm:px-0">
                        <div className="space-y-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Back
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
                                        className="gap-2 h-8 text-xs rounded-2xl"
                                    >
                                        <Languages className="h-3.5 w-3.5" />
                                        {showArabic ? "Switch to English" : "اقرا بالعربي"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            onClick={handleStartStudying}
                            className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 rounded-3xl"
                        >
                            Next Step →
                        </Button>
                    </motion.div>
                )}

                {/* ─────────── STEP 1.5: PRE-QUIZ ─────────── */}
                {step === "pre-quiz" && lecture.pre_quiz && (
                    <motion.div key="pre-quiz" {...pageVariants} className="space-y-6 w-full max-w-2xl mx-auto pt-6 px-4 sm:px-0">
                        <div className="space-y-2 mb-8 text-center">
                            <BrainCircuit className="h-10 w-10 text-primary mx-auto mb-2 opacity-80" />
                            <h2 className="text-2xl font-bold tracking-tight">Activate Prior Knowledge</h2>
                            <p className="text-muted-foreground text-sm">
                                Think about these questions before you start. No grades, just priming your brain.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {lecture.pre_quiz.map((pq, idx) => (
                                <Card key={idx} className="border-none shadow-md bg-white">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <p className="text-foreground font-medium leading-relaxed">{pq.question}</p>
                                        </div>
                                        
                                        <div className="pl-9">
                                            <AnimatePresence mode="wait">
                                                {!showHintParams.has(idx) ? (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => togglePreQuizHint(idx)}
                                                            className="text-muted-foreground text-xs gap-1.5 h-8 -ml-3"
                                                        >
                                                            <EyeOff className="h-3.5 w-3.5" />
                                                            Show Hint
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }} 
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        className="text-sm text-foreground/80 bg-accent/10 px-4 py-3 rounded-2xl border border-accent/20"
                                                        dir="rtl"
                                                    >
                                                        <span className="font-semibold text-accent-foreground/70 text-xs uppercase tracking-wider block mb-1">Hint</span>
                                                        {pq.hint}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Button
                            onClick={() => setStep("timer")}
                            className="w-full py-6 mt-8 text-base font-semibold shadow-xl shadow-primary/20 rounded-3xl"
                        >
                            I&apos;ve thought about it, let&apos;s go →
                        </Button>
                    </motion.div>
                )}

                {/* ─────────── STEP 2: ACTIVE SESSION & QUIZ ─────────── */}
                {step === "timer" && (
                    <motion.div key="timer" {...pageVariants} className="flex flex-col min-h-screen pb-24 relative -mx-4 sm:mx-0">
                        {pomodoroMode === "settings" && !showQuiz && <TelegramBanner />}
                        
                        {/* Pomodoro & Focus Block */}
                        <motion.div
                            layout
                            className={cn(
                                "transition-all duration-700 w-full mb-6 relative",
                                !showQuiz
                                    ? "flex flex-col items-center justify-center flex-1 my-auto pt-24 px-4"
                                    : "bg-background border-b pb-4 pt-4 shadow-sm px-4"
                            )}
                        >
                            {pomodoroMode === "settings" && !showQuiz ? (
                                /* --- SETTINGS UI --- */
                                <motion.div layout className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="text-center space-y-2">
                                        <Settings2 className="h-10 w-10 text-primary mx-auto opacity-80" />
                                        <h2 className="text-2xl font-bold">Session {pomodoroCount}</h2>
                                        <p className="text-muted-foreground text-sm">Set your Pomodoro intervals</p>
                                    </div>
                                    
                                    <div className="space-y-6 bg-white p-6 rounded-3xl shadow-xl border border-primary/5">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Focus Length (min)</Label>
                                            <Input 
                                                type="number" 
                                                value={focusLength} 
                                                onChange={(e) => setFocusLength(e.target.value)} 
                                                className="text-lg py-6 rounded-2xl bg-muted/30 focus-visible:ring-primary/30"
                                                min="1"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Break Length (min)</Label>
                                            <Input 
                                                type="number" 
                                                value={breakLength} 
                                                onChange={(e) => setBreakLength(e.target.value)} 
                                                className="text-lg py-6 rounded-2xl bg-muted/30 focus-visible:ring-primary/30"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <Button size="lg" onClick={handleStartTimer} className="w-full py-6 font-bold shadow-lg shadow-primary/20 rounded-3xl text-lg">
                                        Start Focus Session
                                    </Button>
                                </motion.div>
                            ) : (
                                /* --- ACTIVE TIMER UI --- */
                                <>
                                    <div className={cn("mx-auto flex transition-all duration-700", !showQuiz ? "flex-col items-center space-y-4" : "items-center justify-between w-full max-w-2xl")}>
                                        <motion.div layout className={cn("flex items-center gap-2 text-muted-foreground", !showQuiz ? "text-sm font-medium" : "text-[10px] sm:text-xs font-bold uppercase tracking-widest shrink-0")}>
                                            <Timer className={cn("text-primary", isRunning && pomodoroMode === "focus" && "animate-pulse", !showQuiz ? "h-5 w-5" : "h-3.5 w-3.5")} />
                                            {pomodoroMode === "focus" ? `Focus Session ${pomodoroCount}` : pomodoroMode === "break" ? "Break Time" : "Paused"}
                                        </motion.div>

                                        <motion.div layout className={cn("font-mono font-bold tracking-tight tabular-nums transition-all duration-700", !showQuiz ? "text-8xl mt-2 text-foreground" : "text-xl sm:text-2xl mt-0.5 sm:mt-0 grow", showQuiz && "ml-4 text-foreground")}>
                                            {formatElapsed(timeRemaining)}
                                        </motion.div>

                                        {showQuiz && (
                                            <motion.div layout className="flex gap-2 shrink-0 self-end sm:self-auto">
                                                {!isRunning ? (
                                                    <Button size="sm" variant="outline" onClick={handleResume} className="gap-2 rounded-xl">
                                                        <Play className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Resume</span>
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={handlePause} className="gap-2 rounded-xl">
                                                        <Pause className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Pause</span>
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="destructive" onClick={handleSaveWithoutQuiz} className="gap-1.5 shadow-sm rounded-xl">
                                                    <Square className="h-3.5 w-3.5 fill-current" />
                                                    End <span className="hidden sm:inline">& Save</span>
                                                </Button>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Focus Phase Controls (Only when not taking quiz) */}
                                    {!showQuiz && (
                                        <motion.div layout className="mt-12 flex flex-col gap-3 w-full max-w-xs mx-auto text-center relative z-20">
                                            {focusPhase === "running" ? (
                                                <>
                                                    <h2 className="text-base font-medium text-foreground/70 mb-4 px-4">{lecture.title}</h2>
                                                    <div className="flex gap-3">
                                                        {!isRunning ? (
                                                            <Button size="lg" onClick={handleResume} className="flex-1 py-6 font-semibold gap-2 shadow-lg shadow-primary/20 rounded-3xl">
                                                                <Play className="h-5 w-5 fill-current" /> Resume
                                                            </Button>
                                                        ) : (
                                                            <Button size="lg" variant="outline" onClick={handlePause} className="flex-1 py-6 font-semibold gap-2 border-primary/20 hover:bg-primary/5 rounded-3xl">
                                                                <Pause className="h-5 w-5 fill-current" /> Pause
                                                            </Button>
                                                        )}
                                                        <Button size="lg" variant="outline" onClick={handleReset} className="w-16 p-0 shrink-0 text-muted-foreground hover:text-foreground rounded-3xl border-primary/10">
                                                            <RefreshCw className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                    
                                                    <Button size="lg" variant="destructive" onClick={() => { handlePause(); setFocusPhase("choosing"); }} className="w-full py-6 font-semibold gap-2 shadow-sm rounded-3xl mt-4">
                                                        <Square className="h-4 w-4 fill-current" /> End Focus Session
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                                    <p className="text-sm text-foreground font-semibold mb-1">Session Paused ⏱️</p>
                                                    <p className="text-xs text-muted-foreground mb-4">Would you like to review with a quiz or just wrap up?</p>
                                                    {quiz.length > 0 && (
                                                        <Button size="lg" onClick={() => setShowQuiz(true)} className="w-full py-6 font-bold shadow-lg shadow-primary/20 gap-2 rounded-3xl">
                                                            <BookOpen className="h-5 w-5" />
                                                            Take Active Quiz
                                                        </Button>
                                                    )}
                                                    <Button size="lg" variant="outline" onClick={handleSaveWithoutQuiz} className="w-full py-6 font-semibold gap-2 border-primary/20 hover:bg-green-500/5 hover:text-green-600 rounded-3xl">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Save Session & Dashboard
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => { handleResume(); setFocusPhase("running"); }} className="w-full mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                                                        Nevermind, back to focus
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </>
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
                                    <Card className="border-none shadow-sm bg-card/50 rounded-3xl">
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
                                                        "w-full text-left flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm transition-all duration-150",
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
                                                "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                                                answers[answers.length - 1]?.correct
                                                    ? "border-green-400/40 bg-green-500/5 text-green-700"
                                                    : "border-red-400/40 bg-red-500/5 text-red-700"
                                            )}
                                            dir="rtl"
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
                                                className="flex-1 py-6 font-semibold shadow-md rounded-3xl"
                                            >
                                                Submit Answer
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleNextQuiz}
                                                className="flex-1 py-6 font-semibold gap-2 shadow-md hover:translate-x-1 transition-transform rounded-3xl"
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
                    <motion.div key="completion" {...pageVariants} className="flex flex-col items-center justify-center min-h-[75vh] space-y-8 text-center max-w-2xl mx-auto w-full px-4 sm:px-0 relative">
                        {/* Celebration Burst */}
                        <AnimatePresence>
                            {celebrate && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
                                >
                                    {[...Array(20)].map((_, i) => {
                                        const angle = (i / 20) * Math.PI * 2;
                                        const distance = 400 + Math.sin(i * 10) * 200;
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ 
                                                    top: "50%", 
                                                    left: "50%", 
                                                    scale: 0,
                                                    x: 0,
                                                    y: 0
                                                }}
                                                animate={{ 
                                                    scale: [0, 1, 0.5],
                                                    x: Math.cos(angle) * distance,
                                                    y: Math.sin(angle) * distance,
                                                }}
                                                transition={{ 
                                                    duration: 2,
                                                    ease: "easeOut",
                                                    repeat: Infinity,
                                                    repeatDelay: (i % 5) * 0.4
                                                }}
                                                className={cn(
                                                    "absolute w-3 h-3 rounded-full shadow-lg",
                                                    i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-emerald-400"
                                                )}
                                            />
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4 relative z-10">
                            <motion.div 
                                animate={celebrate ? { 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                } : {}}
                                transition={{ duration: 0.5 }}
                                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                            >
                                <CheckCircle2 className="h-10 w-10 text-primary" />
                            </motion.div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {celebrate ? "Horizon Unlocked! 🎯" : "Session Complete!"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                You focused strictly for
                            </p>
                            <p className="text-5xl font-mono font-bold tabular-nums text-primary">
                                {Math.max(1, Math.round(finalElapsed / 60000))}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground mt-2">
                                minutes officially logged to your dashboard.
                            </p>
                        </div>

                        {!skippedQuiz && quiz.length > 0 && (
                            <Card className={cn(
                                "w-full max-w-sm mx-auto shadow-sm border-dashed rounded-3xl",
                                celebrate ? "bg-primary/5 border-primary/20" : "bg-muted/20"
                            )}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-muted-foreground">Quiz Score</span>
                                    <div className="flex items-center gap-2">
                                        <Trophy className={cn("h-4 w-4", celebrate ? "text-primary animate-bounce" : "text-muted-foreground")} />
                                        <span className={cn("font-bold", celebrate && "text-primary text-lg")}>{scorePercent}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                            <Button
                                className="w-full py-6 font-semibold shadow-md gap-2 rounded-3xl"
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
