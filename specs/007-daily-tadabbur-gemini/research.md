# Research & Technical Decisions: Daily Tadabbur & Gemini Integration

## Technical Context Unknowns Resolved

Based on the feature specification and the project constitution, all technical boundaries have been outlined and the following unknowns have been resolved:

- **AI SDK**: We will use the `@google/genai` (or `google-generative-ai`) official SDK.
- **Data Persistence**: We will use the existing Firebase Firestore instance (via `firebase-admin` on the server for batch generation, and `@firebase/firestore` on the client for reading).
- **Execution Environment**: Generating 7 JSON objects at once via AI will take a few seconds. To ensure the user UI is not blocked, we will use a Next.js Server Action (`export async function generateWeeklyTadabbur()`).

## External API Strategy: Quran.com API

- **Decision**: Fetch actual Uthmani text and audio from `api.quran.com` on the client-side.
- **Rationale**: The core requirement strictly forbids the AI from hallucinating Quranic text formatting or altering the words of the Quran. By forcing the AI to only generate the references (`surahNumber` and `ayahNumber`), we decouple the exact sacred text from the probabilistic generation process.
- **Retrieval Pattern**: When the `DailyTadabburWidget` mounts, if it has a `surahNumber` and `ayahNumber` from Firestore, it conducts a `fetch` directly to `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key={surahNumber}:{ayahNumber}`.

## Uniqueness & Anti-Duplication Strategy

- **Decision**: Prefix the Prompt with a blocklist.
- **Rationale**: Before the Server Action calls Gemini, it queries the `daily_insights` Firestore collection, ordering by `createdAt` descending, limited to the last 30 documents. It extracts the used `{surahNumber}:{ayahNumber}` pairs.
- **Implementation**: The system prompt will inject: *"Do NOT use these verse references: 2:155, 3:200, 94:5"*. This ensures a rolling 30-day window where users never see the exact same verse twice.

## Content Localization & Persona

- **Decision**: AI System Prompt constraints.
- **Rationale**: The specification mandates "respectful Egyptian Arabic" and a "respectful Islamic Mentor" tone. The system prompt sent to Gemini must explicitly define these boundaries, preventing casual vernacular handling of serious topics and strictly forbidding personal unverified tafsir interpretations. 
