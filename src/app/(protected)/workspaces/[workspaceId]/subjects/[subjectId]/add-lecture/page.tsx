"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ExternalLink, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NOTEBOOK_LM_PROMPT } from "@/lib/constants/prompts";
import { LectureImportSchema } from "@/lib/validations/lecture";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddLecturePage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const subjectId = params.subjectId as string;

    const [rawJson, setRawJson] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(NOTEBOOK_LM_PROMPT);
            setCopied(true);
            toast.success("Prompt copied! Paste it into NotebookLM.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy prompt to clipboard.");
        }
    };

    const handleSubmit = async () => {
        if (!rawJson.trim()) {
            toast.error("Please paste the JSON output from NotebookLM.");
            return;
        }

        setSubmitting(true);
        try {
            let parsed;
            try {
                parsed = JSON.parse(rawJson);
            } catch {
                toast.error("Invalid JSON. Check the output from NotebookLM for extra text.");
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

            // Save to Firestore: workspaces/{wid}/subjects/{sid}/lectures/{lid}
            await addDoc(collection(db, "workspaces", workspaceId, "subjects", subjectId, "lectures"), {
                ...result.data,
                workspaceId,
                subjectId,
                createdAt: serverTimestamp(),
            });

            toast.success("Lecture added successfully!");
            router.push(`/workspaces/${workspaceId}/subjects`);
        } catch (err) {
            console.error("Error adding lecture:", err);
            toast.error("An error occurred while saving the lecture.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Subjects
                </Button>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">✨ Add a New Lecture</h1>
                    <p className="text-muted-foreground">
                        How to summon your lecture from the AI realm using Dr. Molar&apos;s magic.
                    </p>
                </div>
            </div>

            {/* Step 1: Instructions */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] text-primary-foreground font-bold">1</span>
                        Prepare the Oracle
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
                    <p>
                        NotebookLM is a powerful AI research tool from Google that can transform your notes into structured knowledge.
                        Since Dr. Molar is far too powerful to be contained in an iframe, you&apos;ll need to visit the AI realm directly.
                    </p>
                    <p>
                        We&apos;ve engineered a specific &quot;Magic Prompt&quot; that guides Dr. Molar to generate
                        clinically-rich dental content in the exact format our system understands.
                    </p>
                </CardContent>
            </Card>

            {/* Step 2: Open NotebookLM */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] text-primary-foreground font-bold">2</span>
                        Enter the Oracle
                    </CardTitle>
                    <CardDescription>Open NotebookLM in a new tab and upload your source material.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="gap-2">
                        <a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer">
                            Open NotebookLM
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {/* Step 3: Copy Prompt */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] text-primary-foreground font-bold">3</span>
                        Arm Yourself
                    </CardTitle>
                    <CardDescription>Copy the Magic Prompt and paste it into NotebookLM&apos;s chat.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleCopyPrompt}
                        variant={copied ? "outline" : "default"}
                        className="gap-2 transition-all duration-300 w-full sm:w-auto"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Copied ✓
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy Magic Prompt
                            </>
                        )}
                    </Button>
                    <div className="rounded-md bg-muted p-4 border overflow-hidden">
                        <p className="text-[12px] font-mono text-muted-foreground leading-tight whitespace-pre-wrap line-clamp-3">
                            {NOTEBOOK_LM_PROMPT}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Paste & Submit */}
            <Card className="border-none shadow-sm border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] text-primary-foreground font-bold">4</span>
                        Paste & Summon
                    </CardTitle>
                    <CardDescription>Paste Dr. Molar&apos;s full JSON response below. The lecture title is read directly from the JSON.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="json" className="text-sm font-medium">Dr. Molar&apos;s Response (JSON)</label>
                        <Textarea
                            id="json"
                            placeholder="Paste the raw JSON from NotebookLM here..."
                            className="min-h-[350px] font-mono text-xs leading-relaxed"
                            value={rawJson}
                            onChange={(e) => setRawJson(e.target.value)}
                            disabled={submitting}
                        />
                    </div>
                    <Button
                        onClick={handleSubmit}
                        className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/20"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Summoning Lecture...
                            </>
                        ) : (
                            "Generate Lecture →"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
