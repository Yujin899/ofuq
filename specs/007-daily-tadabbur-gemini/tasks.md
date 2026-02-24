# Tasks: Daily Tadabbur & Gemini Integration

**Branch**: `007-daily-tadabbur-gemini`
**Generated**: 2026-02-24

## Implementation Strategy
- **Phase 1 & 2**: Establish foundational Firebase access logic securely.
- **Phase 3**: Deliver the P1 User Value immediately (the dashboard UI layer reading mock/foundational data).
- **Phase 4**: Implement the batch generation engine that powers the UI.
- **Phase 5**: Final visual polish and error boundaries.

## Dependencies & Execution Graph
- `Phase 3 (View)` depends on `Phase 2 (Data Layer)`
- `Phase 4 (Generate)` depends on `Phase 2 (Data Layer)`
- *Phase 3 and Phase 4 can be developed in parallel up to integration.*

---

## Phase 1: Setup
- [x] T001 Verify `lucide-react`, `framer-motion` (already present) and install `@google/genai` (or verify standard API fetch works). Ensure `GEMINI_API_KEY` is loaded in `package.json`

## Phase 2: Foundational
- [x] T002 Implement `daily_insights` interface and basic Firestore CRUD in `src/lib/firebase/daily-insights.ts`

## Phase 3: [US1] Viewing Daily Tadabbur (P1)
**Story Goal**: Render today's insight on the dashboard using a mix of database narrative and direct Quran API text.
**Independent Test**: Load the dashboard with a mock Firestore record and verify accurate Uthmani text appearance.
- [x] T003 [P] [US1] Scaffold UI structure in `src/components/dashboard/daily-tadabbur-widget.tsx`
- [x] T004 [US1] Implement `api.quran.com` client-side hydration within `src/components/dashboard/daily-tadabbur-widget.tsx`
- [x] T005 [US1] Embed the `DailyTadabburWidget` onto the main dashboard hub in `src/app/(protected)/page.tsx`
- [x] T006 [US1] Connect "الحمد لله" dismiss button logic in `src/components/dashboard/daily-tadabbur-widget.tsx`

## Phase 4: [US2] Batch Generation of Insights (P2)
**Story Goal**: Automatically generate 7 varied Islamic insights in one batch without duplicating recent verses.
**Independent Test**: Execute the server action directly and verify 7 correctly structured documents appear in Firebase without hitting rate limits.
- [x] T007 [P] [US2] Create Server Action file `src/app/(api)/actions/daily-insight-actions.ts`
- [x] T008 [US2] Implement duplicate prevention logic blocklist querying in `src/app/(api)/actions/daily-insight-actions.ts`
- [x] T009 [US2] Implement Gemini generation call using strict Egyptian Arabic prompting in `src/app/(api)/actions/daily-insight-actions.ts`
- [x] T010 [US2] Parse the resulting JSON array and commit it as 7 concurrent batch writes in `src/app/(api)/actions/daily-insight-actions.ts`

## Phase 5: Polish & Cross-Cutting Concerns
- [x] T011 Apply Uthmani CSS font classes to the UI inside `src/components/dashboard/daily-tadabbur-widget.tsx`
- [x] T012 Implement error boundary fallback in case the AI fails in `src/components/dashboard/daily-tadabbur-widget.tsx`
