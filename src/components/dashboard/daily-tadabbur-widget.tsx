"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInsightForToday, type DailyInsight } from "@/lib/firebase/daily-insights";
import { generateWeeklyTadabbur } from "@/app/(api)/actions/daily-insight-actions";
// Note: We use the local font class for the Uthmani script. It should be defined in layout or globals.

interface DailyTadabburWidgetProps {
    className?: string;
    // For Phase 3, we allow passing a mock insight before wiring up the real Firestore listener
    mockInsight?: DailyInsight | null;
}

export function DailyTadabburWidget({ className, mockInsight }: DailyTadabburWidgetProps) {
    const [insight, setInsight] = useState<DailyInsight | null>(null);
    const [verseText, setVerseText] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Load the Insight
    useEffect(() => {
        if (mockInsight !== undefined) {
            setInsight(mockInsight);
            return;
        }

        const fetchTodayInsight = async () => {
            setLoading(true);
            const todayStr = format(new Date(), "yyyy-MM-dd");
            let result = await getInsightForToday(todayStr);

            // Auto-generation logic if we have run out of insights
            if (!result) {
                setIsGenerating(true);
                try {
                    const genResult = await generateWeeklyTadabbur();
                    if (genResult.success) {
                        // Double check the DB for the newly written insight
                        result = await getInsightForToday(todayStr);
                    } else {
                        console.error("Auto-generation failed:", genResult.error);
                    }
                } catch (e) {
                    console.error("Auto-gen error:", e);
                } finally {
                    setIsGenerating(false);
                }
            }

            setInsight(result);
            setLoading(false);
        };

        fetchTodayInsight();
    }, [mockInsight]);

    // 2. Hydrate the exact authentic Uthmani text from Quran.com API
    useEffect(() => {
        if (!insight) return;

        const fetchVerse = async () => {
            setLoading(true);
            try {
                // Example: https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=2:155
                const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${insight.surahNumber}:${insight.ayahNumber}`);
                if (!res.ok) throw new Error("Failed to fetch verse");

                const data = await res.json();
                // The API actually returns an array for the specific verse_key query? 
                // Let's check documentation: usually it returns an array of verses if using /quran/verses/uthmani.
                // It is safer to use: /api/v4/verses/by_key/{verse_key}?words=false
                // Actually, the simplest for just uthmani text:
                // GET https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=2:155
                // The response is: { "verses": [ { "id": 162, "verse_key": "2:155", "text_uthmani": "وَلَنَبْلُوَنَّكُم ..." } ] }

                // We'll safely parse the 'verses' array
                if (data.verses && data.verses.length > 0) {
                    setVerseText(data.verses[0].text_uthmani);
                } else {
                    throw new Error("Verse not found in response array");
                }
            } catch (err) {
                console.error("Quran API Error:", err);
                setError("Unable to load verse text.");
            } finally {
                setLoading(false);
            }
        };

        fetchVerse();
    }, [insight]);
    if (!insight && !loading) {
        // Silent fail if there is no insight for today
        return null;
    }

    return (
        <Card className={cn("overflow-hidden border-primary/10 bg-linear-to-br from-card to-primary/5", className)}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-primary/10 bg-primary/5">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">تدبر اليوم</h3>
                    <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
                </div>
            </div>

            <CardContent className="p-6 space-y-6">
                {(loading || isGenerating) && !insight && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm font-medium">Generating new insights for the week...</p>
                    </div>
                )}

                {/* 1. Holy Text Section (Uthmani) */}
                <div className="text-center space-y-3 relative p-4 rounded-xl bg-background/50 border border-border/50">
                    <span className="absolute top-2 right-2 text-[10px] font-medium text-muted-foreground px-2 py-1 rounded-sm bg-muted">
                        {insight ? `سورة ${insight.surahNumber} : آية ${insight.ayahNumber}` : "القرآن الكريم"}
                    </span>

                    {loading ? (
                        <div className="space-y-2 flex flex-col items-center pt-4">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-8 w-1/2" />
                        </div>
                    ) : error ? (
                        <p className="text-sm text-destructive py-4">{error}</p>
                    ) : (
                        <p className="font-amiri text-2xl md:text-3xl leading-loose text-foreground pt-4 mb-2 select-text"
                            dir="rtl"
                            style={{ lineHeight: "2.5" }}
                        >
                            {verseText}
                            <span className="relative inline-flex items-center justify-center mx-1 align-middle w-8 h-8">
                                <span className="absolute inset-0 flex items-center justify-center text-primary/70 text-3xl">۝</span>
                                <span className="relative z-10 text-primary font-sans text-[10px] font-bold mt-1">{insight?.ayahNumber}</span>
                            </span>
                        </p>
                    )}
                </div>

                {/* 2. AI Story / Reflection Section */}
                <div className="space-y-4" dir="rtl">
                    {loading && !insight ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {insight?.topics.map(topic => (
                                    <span key={topic} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {insight?.storyContent}
                            </p>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
