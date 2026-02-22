"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lecture, QuizQuestion } from "@/types/lecture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Trophy, RotateCcw, LayoutDashboard, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const pageVariants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const TYPE_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "destructive" }> = {
    single: { label: "Single Choice", variant: "outline" },
    multi: { label: "Multiple Choice", variant: "secondary" },
    case: { label: "Clinical Case", variant: "destructive" },
};

type Phase = "quiz" | "results";

interface AnswerRecord {
    selected: number[];
    correct: boolean;
}

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const subjectId = params.subjectId as string;
    const lectureId = params.lectureId as string;

    const [lecture, setLecture] = useState<Lecture | null>(null);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState<Phase>("quiz");
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);

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

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!lecture || !lecture.quiz?.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
                <p className="text-muted-foreground">Quiz not found.</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const quiz = lecture.quiz;
    const q: QuizQuestion = quiz[currentIdx];
    const progress = ((currentIdx + 1) / quiz.length) * 100;
    const isLastQuestion = currentIdx === quiz.length - 1;

    const toggleOption = (idx: number) => {
        if (submitted) return;
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

    const handleSubmit = () => {
        const sel = Array.from(selected).sort();
        const correct = [...q.correctAnswers].sort();
        const isCorrect = JSON.stringify(sel) === JSON.stringify(correct);
        setAnswers((prev) => [...prev, { selected: sel, correct: isCorrect }]);
        setSubmitted(true);
    };

    const handleNext = () => {
        if (isLastQuestion) {
            setPhase("results");
        } else {
            setCurrentIdx((i) => i + 1);
            setSelected(new Set());
            setSubmitted(false);
        }
    };

    const handleRestart = () => {
        setCurrentIdx(0);
        setSelected(new Set());
        setSubmitted(false);
        setAnswers([]);
        setPhase("quiz");
    };

    const correctCount = answers.filter((a) => a.correct).length;
    const scorePercent = Math.round((correctCount / quiz.length) * 100);

    const getOptionStyle = (optIdx: number) => {
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

    return (
        <div className="max-w-2xl mx-auto pb-16">
            <AnimatePresence mode="wait">

                {/* ──── QUIZ PHASE ──── */}
                {phase === "quiz" && (
                    <motion.div key={`q-${currentIdx}`} {...pageVariants} className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="-ml-2 h-8 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{lecture.title}</span>
                                    <span>{currentIdx + 1} / {quiz.length}</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                            </div>
                        </div>

                        {/* Question Card */}
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <Badge variant={TYPE_BADGE[q.type].variant} className="shrink-0 text-[10px]">
                                        {TYPE_BADGE[q.type].label}
                                    </Badge>
                                </div>
                                <CardTitle className="text-base font-medium leading-relaxed mt-2">
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

                        {/* Explanation (after submit) */}
                        {submitted && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                                    answers[answers.length - 1]?.correct
                                        ? "border-green-400/40 bg-green-500/5 text-green-700 dark:text-green-400"
                                        : "border-red-400/40 bg-red-500/5 text-red-700 dark:text-red-400"
                                )}
                            >
                                <p className="font-semibold mb-1">
                                    {answers[answers.length - 1]?.correct ? "✓ Correct!" : "✗ Not quite."}
                                </p>
                                <p className="text-foreground/80">{q.explanation}</p>
                            </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {!submitted ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={selected.size === 0}
                                    className="flex-1 py-5 font-semibold"
                                >
                                    Submit Answer
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    className="flex-1 py-5 font-semibold gap-2"
                                >
                                    {isLastQuestion ? "See Results" : "Next Question"}
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ──── RESULTS PHASE ──── */}
                {phase === "results" && (
                    <motion.div key="results" {...pageVariants} className="space-y-6">
                        {/* Score Card */}
                        <Card className="border-none shadow-sm text-center">
                            <CardContent className="pt-8 pb-6 space-y-4">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                    <Trophy className="h-10 w-10 text-primary" />
                                </div>
                                <div>
                                    <p className="text-5xl font-bold tabular-nums text-primary">{scorePercent}%</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {correctCount} of {quiz.length} correct
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {scorePercent >= 80
                                        ? "Excellent work! 🎉 Dr. Molar would be proud."
                                        : scorePercent >= 60
                                            ? "Good effort. Review the explanations and try again."
                                            : "Keep studying — you've got this. Review and retry!"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Per-question breakdown */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground px-1">Question Breakdown</p>
                            {quiz.map((qItem, i) => {
                                const rec = answers[i];
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex items-start gap-3 rounded-lg px-4 py-3 text-sm border",
                                            rec?.correct
                                                ? "border-green-400/30 bg-green-500/5"
                                                : "border-red-400/30 bg-red-500/5"
                                        )}
                                    >
                                        {rec?.correct
                                            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                                            : <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />}
                                        <span className="line-clamp-2 text-foreground/80">{qItem.question}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Nav Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button onClick={handleRestart} variant="outline" className="w-full gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Retry Quiz
                            </Button>
                            <Button
                                onClick={() => router.push(`/workspaces/${workspaceId}`)}
                                className="w-full gap-2"
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
