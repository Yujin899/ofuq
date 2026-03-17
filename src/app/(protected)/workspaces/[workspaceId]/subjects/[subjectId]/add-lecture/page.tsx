"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Copy, Check, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { type Easing, motion, AnimatePresence } from "framer-motion";
import { NOTEBOOKLM_PROMPT, CLAUDE_PROMPT_TEMPLATE } from "@/lib/constants/prompts";
import { LectureImportSchema } from "@/lib/validations/lecture";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const stepVariants = {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" as Easing } },
};

const collapsedVariants = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto", transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.3, ease: "easeIn" as Easing } },
};

// ─── Step Badge ───────────────────────────────────────────────────────────────

function StepBadge({ number, active }: { number: number; active: boolean }) {
    return (
        <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground"
            }`}
        >
            {number}
        </span>
    );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy to clipboard.");
        }
    };

    return (
        <Button
            onClick={handleCopy}
            variant={copied ? "outline" : "default"}
            className="gap-2 transition-all duration-300"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied ✓
                </>
            ) : (
                <>
                    <Copy className="h-4 w-4" />
                    {label}
                </>
            )}
        </Button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddLecturePage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const subjectId = params.subjectId as string;

    const [currentStep, setCurrentStep] = useState(1);
    const [notebookOutput, setNotebookOutput] = useState("");
    const [rawJson, setRawJson] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Build the final Claude prompt by injecting NotebookLM output
    const constructedClaudePrompt = CLAUDE_PROMPT_TEMPLATE.replace(
        "{{NOTEBOOKLM_CONTENT}}",
        notebookOutput
    );

    const handleAdvanceToStep2 = () => {
        if (!notebookOutput.trim()) {
            toast.error("Please paste NotebookLM's output before continuing.");
            return;
        }
        setCurrentStep(2);
    };

    const handleAdvanceToStep3 = () => {
        setCurrentStep(3);
    };

    const handleSubmit = async () => {
        if (!rawJson.trim()) {
            toast.error("Please paste Claude's JSON response.");
            return;
        }

        setSubmitting(true);
        try {
            let parsed;
            try {
                parsed = JSON.parse(rawJson);
            } catch {
                toast.error("Invalid JSON — make sure you copied the full response.");
                setSubmitting(false);
                return;
            }

            const result = LectureImportSchema.safeParse(parsed);
            if (!result.success) {
                const firstError = result.error.issues[0];
                const path = firstError.path.join(".");
                toast.error(`Validation failed: ${path} — ${firstError.message}`);
                setSubmitting(false);
                return;
            }

            await addDoc(
                collection(db, "workspaces", workspaceId, "subjects", subjectId, "lectures"),
                {
                    ...result.data,
                    workspaceId,
                    subjectId,
                    createdAt: serverTimestamp(),
                }
            );

            toast.success("Lecture created successfully!");
            router.push(`/workspaces/${workspaceId}/subjects`);
        } catch (err) {
            console.error("Error adding lecture:", err);
            toast.error("An error occurred while saving the lecture.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            {/* Page Header */}
            <motion.div
                className="flex flex-col space-y-4"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Subjects
                </Button>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Sparkles className="h-7 w-7 text-primary" />
                        Add a New Lecture
                    </h1>
                    <p className="text-muted-foreground">
                        Three steps to transform your notes into a full lecture with Dr. Molar&apos;s magic.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 pt-2">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center gap-3">
                            <StepBadge number={step} active={currentStep >= step} />
                            {step < 3 && (
                                <div
                                    className={`h-0.5 w-8 rounded-full transition-colors duration-500 ${
                                        currentStep > step ? "bg-primary" : "bg-muted"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── Collapsed Previous Steps ─────────────────────────────────── */}
            <AnimatePresence>
                {currentStep > 1 && (
                    <motion.div
                        key="collapsed-step-1"
                        variants={collapsedVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Card
                            className="border-none shadow-sm bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors rounded-3xl"
                            onClick={() => setCurrentStep(1)}
                        >
                            <CardContent className="py-4 flex items-center gap-3">
                                <StepBadge number={1} active={false} />
                                <div>
                                    <p className="text-sm font-medium">NotebookLM — Completed</p>
                                    <p className="text-xs text-muted-foreground">
                                        {notebookOutput.length.toLocaleString()} characters extracted
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {currentStep > 2 && (
                    <motion.div
                        key="collapsed-step-2"
                        variants={collapsedVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Card
                            className="border-none shadow-sm bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors rounded-3xl"
                            onClick={() => setCurrentStep(2)}
                        >
                            <CardContent className="py-4 flex items-center gap-3">
                                <StepBadge number={2} active={false} />
                                <div>
                                    <p className="text-sm font-medium">Claude Prompt — Completed</p>
                                    <p className="text-xs text-muted-foreground">
                                        Prompt generated and ready to copy
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Active Step Content ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {/* ── Step 1: NotebookLM ──────────────────────────────────── */}
                {currentStep === 1 && (
                    <motion.div
                        key="step-1"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-linear-to-br from-primary/5 to-accent/10 pb-6">
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <StepBadge number={1} active={true} />
                                    NotebookLM — Extract Content
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed mt-2">
                                    Upload your lecture notes to{" "}
                                    <a
                                        href="https://notebooklm.google.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                                    >
                                        NotebookLM
                                    </a>
                                    , then paste the prompt below into its chat. Copy the full output.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {/* Read-only prompt display */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            Extraction Prompt
                                        </label>
                                        <CopyButton text={NOTEBOOKLM_PROMPT} label="Copy Prompt" />
                                    </div>
                                    <Textarea
                                        readOnly
                                        value={NOTEBOOKLM_PROMPT}
                                        className="min-h-[160px] font-mono text-xs leading-relaxed bg-muted/30 resize-none cursor-default rounded-2xl"
                                    />
                                </div>

                                {/* Paste output area */}
                                <div className="space-y-3">
                                    <label htmlFor="notebook-output" className="text-sm font-medium">
                                        Paste NotebookLM&apos;s Output Here
                                    </label>
                                    <Textarea
                                        id="notebook-output"
                                        placeholder="Paste the full extracted content from NotebookLM here..."
                                        className="min-h-[240px] font-mono text-xs leading-relaxed rounded-2xl"
                                        value={notebookOutput}
                                        onChange={(e) => setNotebookOutput(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handleAdvanceToStep2}
                                    className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 rounded-2xl gap-2"
                                >
                                    Generate Claude Prompt
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ── Step 2: Claude Prompt ───────────────────────────────── */}
                {currentStep === 2 && (
                    <motion.div
                        key="step-2"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-linear-to-br from-primary/5 to-accent/10 pb-6">
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <StepBadge number={2} active={true} />
                                    Claude — Generate Lecture
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed mt-2">
                                    Open{" "}
                                    <a
                                        href="https://claude.ai/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                                    >
                                        claude.ai
                                    </a>
                                    , enable <strong>Extended Thinking</strong>, paste the prompt below, and copy the full JSON response.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            Final Dr. Molar Prompt
                                        </label>
                                        <CopyButton
                                            text={constructedClaudePrompt}
                                            label="Copy Prompt"
                                        />
                                    </div>
                                    <Textarea
                                        readOnly
                                        value={constructedClaudePrompt}
                                        className="min-h-[240px] font-mono text-xs leading-relaxed bg-muted/30 resize-none cursor-default rounded-2xl"
                                    />
                                </div>

                                <Button
                                    onClick={handleAdvanceToStep3}
                                    className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 rounded-2xl gap-2"
                                >
                                    I have Claude&apos;s response
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ── Step 3: JSON Input ──────────────────────────────────── */}
                {currentStep === 3 && (
                    <motion.div
                        key="step-3"
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-linear-to-br from-primary/5 to-accent/10 pb-6">
                                <CardTitle className="text-xl flex items-center gap-3">
                                    <StepBadge number={3} active={true} />
                                    Paste &amp; Create Lecture
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed mt-2">
                                    Paste Dr. Molar&apos;s full JSON response. The title, intro, and quiz will be extracted automatically.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-3">
                                    <label htmlFor="json-input" className="text-sm font-medium">
                                        Claude&apos;s JSON Response
                                    </label>
                                    <Textarea
                                        id="json-input"
                                        placeholder="Paste the raw JSON from Claude here..."
                                        className="min-h-[350px] font-mono text-xs leading-relaxed rounded-2xl"
                                        value={rawJson}
                                        onChange={(e) => setRawJson(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 rounded-2xl gap-2"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Creating Lecture...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            Generate Lecture
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
