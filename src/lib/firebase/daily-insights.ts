import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, limit, orderBy, runTransaction, Timestamp } from "firebase/firestore";

export interface DailyInsight {
    id: string; // The specific date string, e.g., '2023-10-27'
    displayDate: Timestamp;
    surahNumber: number;
    ayahNumber: number;
    storyContent: string;
    topics: string[];
    isPublished: boolean;
    createdAt?: Timestamp;
}

const COLLECTION_NAME = "daily_insights";

/**
 * Validates and saves a batch of daily insights to Firestore.
 */
export async function batchSaveInsights(insights: DailyInsight[]): Promise<void> {
    const promises = insights.map(async (insight) => {
        // We use the date string as the document ID for easy retrieval
        const docRef = doc(db, COLLECTION_NAME, insight.id);
        await setDoc(docRef, {
            ...insight,
            createdAt: Timestamp.now(),
        }, { merge: true });
    });

    await Promise.all(promises);
}

/**
 * Retrieves the specific insight meant for today.
 */
export async function getInsightForToday(dateString: string): Promise<DailyInsight | null> {
    console.log(`[DailyInsights DB] Fetching insight for date: ${dateString}`);
    try {
        const q = query(collection(db, COLLECTION_NAME), where("__name__", "==", dateString));
        const snapshot = await getDocs(q);
        console.log(`[DailyInsights DB] Snapshot empty? ${snapshot.empty}`);

        if (snapshot.empty) {
            return null;
        }

        const data = snapshot.docs[0].data() as DailyInsight;
        console.log(`[DailyInsights DB] Found document data`, data);
        return {
            ...data,
            id: snapshot.docs[0].id,
        };
    } catch (error) {
        console.error("Error fetching today's insight:", error);
        return null;
    }
}

/**
 * Fetches the most recently generated references to avoid duplicates during batch generation.
 */
export async function getRecentVerseReferences(limitCount: number = 30): Promise<{ surah: number, ayah: number }[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                surah: data.surahNumber,
                ayah: data.ayahNumber
            };
        });
    } catch (error) {
        console.error("Error fetching recent verse references:", error);
        return [];
    }
}

/**
 * Helper strictly for the UI to dismiss/mark today's insight as read.
 * (This could also be tracked per-user in a subcollection, but for Phase 7 MVP,
 * we will rely on local storage for dismissal to keep reads low, or update a global flag if needed).
 */
export async function markInsightAsPublished(insightId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, insightId);
    await setDoc(docRef, { isPublished: true }, { merge: true });
}

/**
 * Attempts to acquire a global daily lock for generating new insights to protect AI API limits.
 * Uses a Firestore transaction to ensure atomic checking.
 * Returns true if the lock was acquired (meaning generation should proceed), false if it was already locked today.
 */
export async function acquireDailyGenerationLock(dateString: string): Promise<boolean> {
    const lockRef = doc(db, "system_state", "tadabbur_generation_lock");
    try {
        await runTransaction(db, async (transaction) => {
            const lockDoc = await transaction.get(lockRef);
            if (!lockDoc.exists()) {
                transaction.set(lockRef, { lastRunDate: dateString });
                return;
            }

            const data = lockDoc.data();
            if (data.lastRunDate === dateString) {
                // Already ran today, throw an error to break the transaction intentionally
                throw new Error("ALREADY_LOCKED");
            }

            transaction.update(lockRef, { lastRunDate: dateString });
        });
        return true;
    } catch (e: any) {
        if (e.message === "ALREADY_LOCKED") {
            return false;
        }
        console.error("Failed to acquire daily lock:", e);
        // On an unexpected failure, default to false to protect AI tokens
        return false;
    }
}
