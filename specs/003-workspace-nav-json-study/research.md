# Research: Phase 3 — Workspace Navigation, JSON Ingestion & Study Loop

**Branch**: `003-workspace-nav-json-study`  
**Date**: 2026-02-22

---

## Decision Log

### 1. Sidebar Collapsible — `shadcn/ui` Collapsible vs. Accordion

- **Decision**: Use `shadcn/ui` **Collapsible** (not Accordion)
- **Rationale**: The spec (FR-007) explicitly states multiple workspaces must be expandable simultaneously. The `Accordion` component in `shadcn/ui` enforces single-open behavior by default. `Collapsible` provides a simple, independently controlled expand/collapse per item with no coupling between items.
- **Alternatives Considered**: Accordion (rejected: enforces mutual exclusion), custom disclosure (rejected: violates constitution's shadcn-first rule)
- **Implementation Note**: Wrap each workspace list item in its own `<Collapsible>`. Use a `useState` per workspace entry or a `Map<string, boolean>` to track open state.

---

### 2. Zod Schema Strategy — Flat vs. Nested Schema File

- **Decision**: Dedicate `src/lib/validations/lecture.ts` to the Zod schema. Export the schema AND the inferred TypeScript type. Re-use the type in both the dialog component and Firestore write helper.
- **Rationale**: Constitution §IV requires types to be defined before the feature consuming them. A dedicated file avoids duplication and makes validation logic independently testable.
- **Alternatives Considered**: Inline schema in the dialog component (rejected: violates constitution's modularity principle)

---

### 3. NotebookLM JSON Schema — Defined Structure

Based on the spec (FR-009), the strict Zod schema is:

```typescript
const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctAnswer: z.string().min(1),
}).refine(data => data.options.includes(data.correctAnswer), {
  message: "correctAnswer must be one of the provided options"
});

const LectureImportSchema = z.object({
  title: z.string().min(1, "Lecture title is required"),
  introSummary: z.string().min(1, "Intro summary is required"),
  reflectionQuestions: z.array(z.string().min(1)).length(3, "Exactly 3 reflection questions are required"),
  quizData: z.array(QuizQuestionSchema).min(1, "At least 1 quiz question is required"),
});
```

---

### 4. Timer Accuracy — Timestamp-Based vs. Interval-Only

- **Decision**: Store `startTimestamp = Date.now()` in `localStorage` on session start. Use `setInterval` only to trigger re-renders every second, NOT to increment a counter. Compute display time as `Date.now() - startTimestamp` on each render tick.
- **Rationale**: `setInterval` drifts when tabs are backgrounded (browsers throttle inactive tabs). Comparing against a persisted `startTimestamp` guarantees wall-clock accuracy regardless of tab state. Complies with constitution §III.
- **localStorage key pattern**: `ofuq_session_${lectureId}` storing `{ startTimestamp: number }`

---

### 5. Framer Motion Step Transitions

- **Decision**: Use a shared `step` state (0: Intro, 1: Timer, 2: Completion). Wrap the entire step content in `<AnimatePresence mode="wait">`. Each step renders as a `<motion.div>` with `initial`, `animate`, and `exit` variants.
- **Variants**:
  - `initial`: `{ opacity: 0, x: 30 }`
  - `animate`: `{ opacity: 1, x: 0 }`
  - `exit`: `{ opacity: 0, x: -30 }`
- **Rationale**: `mode="wait"` ensures the exit animation of the outgoing step completes before the incoming step enters, preventing visual overlap.
- **Dependencies**: `framer-motion` is listed in the constitution's Mandatory Libraries table and must be installed via npm.

---

### 6. Dynamic Route Structure

```
src/app/(protected)/workspaces/[workspaceId]/
├── page.tsx                              (Overview — charts, existing)
├── board/
│   └── page.tsx                          (Whiteboard placeholder — NEW)
└── subjects/
    ├── page.tsx                           (Subjects & Lectures list — NEW)
    └── [subjectId]/
        └── lectures/
            └── [lectureId]/
                └── page.tsx              (Study Loop shell — NEW)
```

---

### 7. Study Session localStorage Key & Cleanup

- Start: `localStorage.setItem("ofuq_session_${lectureId}", JSON.stringify({ startTimestamp: Date.now() }))`
- Cleanup: `localStorage.removeItem("ofuq_session_${lectureId}")` called in the `useStudyTimer` hook's cleanup function (returned from `useEffect`) and on session completion.
- Recovery: On mount, `useStudyTimer` reads from localStorage. If a session already exists for the same `lectureId`, it resumes from the stored timestamp — handles page refresh during an active session.

---

### 8. Motivational Toast Timing

- **Interval**: Every 25 minutes (1,500,000 ms)
- **Implementation**: Track `lastToastAt` ref (does not cause re-renders). On each timer tick, check if `elapsed - lastToastAt.current >= 1_500_000`. If so, fire toast and update `lastToastAt.current`.
- **Messages**: Rotate through a small predefined array of motivational strings.
