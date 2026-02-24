# Implementation Plan: Daily Tadabbur & Gemini Integration

**Branch**: `007-daily-tadabbur-gemini` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-daily-tadabbur-gemini/spec.md`

## Summary

This phase introduces a "Spiritual Layer" to the app using a Hybrid AI/API approach. It leverages Google Gemini (via Server Actions) to batch-generate 7 days of respectful Islamic insights based on specific Quranic verses, saving them to Firestore. A dedicated UI widget then displays today's insight, fetching the exact Uthmani text client-side from the Quran.com API to prevent AI hallucinations.

## Technical Context

**Language/Version**: TypeScript 5+ (Next.js 14 App Router)
**Primary Dependencies**: `@google/genai`, `firebase`, `framer-motion`, `lucide-react`
**Storage**: Firebase Firestore (`daily_insights` collection)
**Target Platform**: Web Browser (Responsive)
**Project Type**: Next.js Web Application
**Performance Goals**: Sub-second UI load for the widget. Batch generation runs asynchronously in the background.
**Constraints**: AI text generation MUST NOT alter or output Arabic verse text directly. It must only supply `surahNumber` and `ayahNumber`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Framework**: Next.js App Router (Passed)
- **Styling**: Tailwind CSS & `shadcn/ui` (Passed)
- **Backend & Auth**: Firebase Firestore exclusively (Passed)
- **Modularity**: AI Logic isolated in a Server Action under `/actions` (Passed)

*All constitution checks passed.*

## Project Structure

### Documentation (this feature)

```text
specs/007-daily-tadabbur-gemini/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── checklists/
    └── requirements.md  # Specification checklist
```

### Source Code

```text
src/
├── app/
│   ├── (api)/
│   │   └── actions/
│   │       └── daily-insight-actions.ts    # AI Batch generation action
│   └── (protected)/
│       └── page.tsx                        # Will embed the Widget here
├── components/
│   └── dashboard/
│       └── daily-tadabbur-widget.tsx       # Fetches from Quran.com & Firestore
├── lib/
│   └── firebase/
│       └── daily-insights.ts               # Core Firestore CRUD specific to insights
```

**Structure Decision**: Integrated tightly into the existing `src/` Next.js directory. The GenAI logic will live securely in a Server Action file, keeping the lightweight UI component decoupled.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | N/A | Hybrid API approach perfectly satisfies constraints without breaking constitution. |
