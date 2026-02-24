# Data Model: Phase 7 - Daily Tadabbur

## Firestore Collections

### `daily_insights`
Stores the batch-generated daily AI stories and references to the Quran.

- `id` (string): Auto-generated or date-string (e.g., "2023-10-27").
- `displayDate` (Timestamp): The specific date this insight should appear for the user.
- `surahNumber` (number): Reference for the external API to fetch the exact Surah.
- `ayahNumber` (number): Reference for the external API to fetch the exact Ayah.
- `storyContent` (string): The AI-generated narrative/lesson (written in respectful Egyptian Arabic).
- `topics` (Array<string>): Keywords for future filtering (e.g., ["Sabr", "Anxiety"]).
- `isPublished` (boolean): Flag to determine if the insight is ready to be shown.
