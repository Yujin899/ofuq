"use server";

import { GoogleGenAI } from "@google/genai";
import { getRecentVerseReferences, batchSaveInsights, acquireDailyGenerationLock, type DailyInsight } from "@/lib/firebase/daily-insights";
import { Timestamp } from "firebase/firestore";

// Initialize the strongly typed Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * System Prompt enforcing the strict Islamic Mentor persona and output structure.
 */
const SYSTEM_PROMPT = `
You are a respectful Islamic Mentor catering to university students. 
Your goal is to provide daily spiritual insights (Tadabbur) that connect authentic Quranic meaning to modern challenges like patience, science, and faith.
You must speak in warm, respectful Egyptian Arabic.

CRITICAL RULES:
1. You MUST output EXACTLY 7 items in a JSON array.
2. For each item, select a unique Surah and Ayah number that relates to the topic.
3. DO NOT interpret the verse with your own unverified Tafsir. Only derive practical life lessons (Tadabbur) based on established meanings.
4. MAKE THE CONTENT VALUABLE AND IN-DEPTH. The "storyContent" MUST be at least 3 detailed paragraphs long. Do not write a short summary. Provide an engaging, deeply reflective, and practical lesson that a student can genuinely benefit from today.
5. Output Schema per item:
   {
      "surahNumber": number,
      "ayahNumber": number,
      "storyContent": string (the lengthy, 3-paragraph Egyptian Arabic reflection),
      "topics": string[] (1-3 keywords like "الصبر", "العلم")
   }
`;

/**
 * Server Action to generate 7 days of daily insights and save them to Firestore.
 */
export async function generateWeeklyTadabbur() {
    try {
        // 0. Global Rate Limiter: Ensure this is only run ONCE per day safely across all concurrent requests
        const todayStr = new Date().toISOString().split("T")[0];
        const canRun = await acquireDailyGenerationLock(todayStr);
        if (!canRun) {
            console.log("Daily Tadabbur generation already ran today. Skipping to save tokens.");
            return { success: false, error: "Already generated today" };
        }

        // 1. Fetch recent verses to prevent duplicates (T008)
        const recentVerses = await getRecentVerseReferences(30);
        const blocklistStr = recentVerses.length > 0
            ? `\nCRITICAL: DO NOT use any of these verse references: ${recentVerses.map(v => `${v.surah}:${v.ayah}`).join(", ")}`
            : "";

        // 2. Call Gemini for generation (T009)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 7 daily insights focusing on themes of resilience, seeking knowledge, and managing anxiety as a student.${blocklistStr}`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });

        const textOutput = response.text;
        if (!textOutput) {
            throw new Error("Gemini returned an empty response.");
        }

        // 3. Parse and Map the JSON (T010)
        let generatedItems: Array<{ surahNumber: number; ayahNumber: number; storyContent: string; topics?: string[] }>;
        try {
            generatedItems = JSON.parse(textOutput);
            if (!Array.isArray(generatedItems) || generatedItems.length !== 7) {
                throw new Error("Parsed JSON is not an array of 7 items.");
            }
        } catch (_e) {
            console.error("Failed to parse Gemini JSON:", textOutput);
            throw new Error("Invalid JSON structure from AI.");
        }

        const now = new Date();
        const insightsToSave: DailyInsight[] = generatedItems.map((item, index) => {
            // Target date is today + index days
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + index);
            const dateString = targetDate.toISOString().split("T")[0]; // e.g., '2023-10-27'

            return {
                id: dateString,
                displayDate: Timestamp.fromDate(targetDate),
                surahNumber: item.surahNumber,
                ayahNumber: item.ayahNumber,
                storyContent: item.storyContent,
                topics: item.topics || [],
                isPublished: true, // Auto-publish for the MVP
            };
        });

        // 4. Batch Write to Firestore
        await batchSaveInsights(insightsToSave);

        return { success: true, count: insightsToSave.length };

    } catch (error) {
        console.error("Weekly Tadabbur Generation Failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
