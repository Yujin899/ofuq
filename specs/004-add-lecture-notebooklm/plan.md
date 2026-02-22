# Implementation Plan: Add Lecture via NotebookLM

**Branch**: `004-add-lecture-notebooklm` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)

---

## Summary

Replace the `AddLectureDialog` modal with a dedicated full-page workflow that guides users through generating structured dental lecture content using NotebookLM. The implementation involves: updating the data schema (Zod + TypeScript types), creating the new route and UI, storing the Dr. Molar AI prompt as a versioned constant, and writing validated JSON to Firestore as a sub-collection under the workspace subject.

---

## Technical Context

**Language/Version**: TypeScript (strict mode)  
**Primary Dependencies**: Next.js App Router, shadcn/ui, Zod, Firebase Firestore, Clipboard API  
**Storage**: Firestore — `workspaces/{wid}/subjects/{sid}/lectures/{lid}`  
**Testing**: Manual (run `npm run dev`, navigate the route end-to-end)  
**Target Platform**: Web (Next.js 14+ App Router)  
**Project Type**: Web application  
**Performance Goals**: Validation and Firestore write complete in under 2 seconds  
**Constraints**: No iframe embedding (Google blocks NotebookLM). Clipboard API must use `navigator.clipboard.writeText` (HTTPS required).  
**Scale/Scope**: Single page feature; ~4 files modified/created

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Next.js App Router | ✅ PASS | New route uses App Router file system convention |
| Tailwind CSS only | ✅ PASS | No raw CSS added |
| shadcn/ui primitives | ✅ PASS | Button, Textarea, Card, Badge, Toast (sonner) all used |
| Firebase backend | ✅ PASS | Firestore write to sub-collection path |
| Zod validation BEFORE Firestore write | ✅ PASS | Core requirement of the plan |
| TypeScript strict | ✅ PASS | All new types and schema exports are explicitly typed |
| Notion-like aesthetic | ✅ PASS | Full page with clean step-by-step layout, no clutter |
| No invented features | ✅ PASS | Plan strictly follows spec.md |

---

## Project Structure

### Documentation

```text
specs/004-add-lecture-notebooklm/
├── plan.md              ← This file
├── spec.md
├── research.md
├── data-model.md
└── checklists/
    └── requirements.md
```

### Source Code Changes

```text
src/
├── lib/
│   ├── constants/
│   │   └── prompts.ts            [NEW] Dr. Molar prompt constant
│   └── validations/
│       └── lecture.ts            [MODIFY] Full schema replacement
├── types/
│   └── lecture.ts                [MODIFY] Full type replacement
├── app/(protected)/
│   └── workspaces/[workspaceId]/
│       └── subjects/
│           ├── page.tsx          [MODIFY] Replace dialog with router.push
│           └── [subjectId]/
│               └── add-lecture/
│                   └── page.tsx  [NEW] The full Add Lecture page
└── components/
    └── lectures/
        └── add-lecture-dialog.tsx [DELETE] Deprecated by this feature
```

---

## Phase 0: Research ✅

All decisions resolved in [research.md](./research.md). No blockers.

---

## Phase 1: Schema & Types (Foundation)

> **Build types first.** Every subsequent phase depends on these contracts.

### Step 1.1 — Update `src/lib/validations/lecture.ts`

Replace **entire file** with the new schema:

```typescript
import { z } from "zod";

export const ReflectionQuestionSchema = z.object({
    question: z.string().min(1, "Reflection question is required"),
    modelAnswer: z.string().min(1, "Model answer is required"),
});

export const QuizQuestionSchema = z.object({
    type: z.enum(["single", "multi", "case"], {
        errorMap: () => ({ message: 'Question type must be "single", "multi", or "case"' }),
    }),
    question: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1)).min(4).max(5),
    correctAnswers: z
        .array(z.number().int().nonnegative())
        .min(1, "At least one correct answer index required"),
    explanation: z.string().min(1, "Explanation is required"),
});

export const LectureImportSchema = z.object({
    title: z.string().min(1, "Lecture title is required"),
    intro: z.string().min(1, "Intro is required"),
    reflectionQuestions: z
        .array(ReflectionQuestionSchema)
        .length(4, "Exactly 4 reflection questions are required"),
    quiz: z
        .array(QuizQuestionSchema)
        .min(20, "Quiz must have at least 20 questions")
        .max(25, "Quiz must have no more than 25 questions"),
});

export type LectureImport = z.infer<typeof LectureImportSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type ReflectionQuestion = z.infer<typeof ReflectionQuestionSchema>;
```

### Step 1.2 — Update `src/types/lecture.ts`

Replace **entire file** with the new TypeScript interfaces:

```typescript
import { Timestamp } from "firebase/firestore";

export type QuestionType = "single" | "multi" | "case";

export interface ReflectionQuestion {
    question: string;
    modelAnswer: string;
}

export interface QuizQuestion {
    type: QuestionType;
    question: string;
    options: string[];
    correctAnswers: number[];  // 0-indexed
    explanation: string;
}

export interface Lecture {
    id: string;
    workspaceId: string;
    subjectId: string;
    title: string;
    intro: string;
    reflectionQuestions: ReflectionQuestion[];
    quiz: QuizQuestion[];
    createdAt: Timestamp;
}
```

---

## Phase 2: Prompt Constant

### Step 2.1 — Create `src/lib/constants/prompts.ts`

Create a new file. Store the Dr. Molar prompt as an exported constant:

```typescript
export const NOTEBOOK_LM_PROMPT = `[paste the full Dr. Molar prompt from spec.md here, as a template literal]`;
```

The exact prompt text is defined in [spec.md — Section: The NotebookLM Prompt](./spec.md).

---

## Phase 3: Add Lecture Page

### Step 3.1 — Create `src/app/(protected)/workspaces/[workspaceId]/subjects/[subjectId]/add-lecture/page.tsx`

This is a `"use client"` page component. It must:

1. **Read params** using `useParams()` to get `workspaceId` and `subjectId`.
2. **Render a 4-step Notion-like layout** with a sticky header showing "← Back" navigation and the title "Add Lecture".
3. **Step 1 — Summon Your Lecture**: Render engaging instructions (funny, engaging tone) explaining the copy-paste workflow. Use a ordered list with bold step labels.
4. **Step 2 — Open NotebookLM**: Render a prominent `Button` component with `asChild` and an anchor tag. Must use `target="_blank"` and `rel="noopener noreferrer"`. Link to `https://notebooklm.google.com/`.
5. **Step 3 — Copy the Magic Prompt**: Render a "Copy Magic Prompt" `Button`. On click, call `navigator.clipboard.writeText(NOTEBOOK_LM_PROMPT)`. On success, show a `sonner` toast: "Prompt copied! Paste it in NotebookLM." and change button label to "Copied ✓" for 2 seconds before resetting. Handle `ClipboardAPI` errors gracefully.
6. **Step 4 — Paste & Generate**: Render a large `Textarea` (monospace font, minimum 12 rows) with placeholder `"Paste your JSON here..."`. Render a "Generate Lecture" `Button` below it (full width, primary style). Manage a `lectureTitle` text `Input` field above the textarea (required for the Lecture's title field since AI doesn't generate it).
7. **Submit handler** (`handleSubmit`):
   - Guard: If textarea is empty, show error toast and abort.
   - `JSON.parse()` the textarea content. Catch `SyntaxError` and show toast: "Invalid JSON. Please check the output from NotebookLM."
   - Validate parsed object with `LectureImportSchema.safeParse()`. If it fails, show toast with the first Zod error message.
   - If valid, call Firestore `addDoc` on `collection(db, "workspaces", workspaceId, "subjects", subjectId, "lectures")` with the validated data plus `serverTimestamp()` for `createdAt`.
   - On success, show toast "Lecture added successfully!" and navigate to `/workspaces/${workspaceId}/subjects` with `router.push()`.
   - On Firestore error, show error toast.
8. **Loading state**: Show a spinner and disable all interactive elements while submitting.

#### UI Layout Specification

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Subjects                                 │
│  ✨ Add a New Lecture                               │  ← Page Header
│  "How to summon your lecture from the AI realm..."  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Step 1: Read the Instructions      (Card)          │
│  Funny, engaging text about the workflow            │
│                                                     │
│  Step 2: Open the Oracle            (Card)          │
│  [Open NotebookLM ↗]                               │  ← External link button
│                                                     │
│  Step 3: Arm Yourself               (Card)          │
│  [Copy Magic Prompt 📋]                            │  ← Clipboard button
│  Small monospace preview of first 3 lines           │
│                                                     │
│  Step 4: Paste & Summon             (Card)          │
│  Lecture Title: [_________________]                 │
│  ┌──────────────────────────────────────┐           │
│  │ Paste your JSON here...              │           │  ← Monospace Textarea
│  │                                      │           │
│  │                                      │           │
│  └──────────────────────────────────────┘           │
│  [Generate Lecture →]                               │  ← Submit button
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Phase 4: Update Subjects Page Navigation

### Step 4.1 — Modify `src/app/(protected)/workspaces/[workspaceId]/subjects/page.tsx`

- Remove the `AddLectureDialog` import and usage.
- Remove the `addLectureOpen` and `selectedSubjectId` state.
- Import `useRouter` from `next/navigation`.
- Update the "Add Lecture" button's `onClick` from `() => handleAddLecture(subject.id)` to:
  ```typescript
  () => router.push(`/workspaces/${workspaceId}/subjects/${subject.id}/add-lecture`)
  ```
- Remove the `handleAddLecture` function.
- Remove the `<AddLectureDialog>` JSX block at the bottom.

### Step 4.2 — Delete `src/components/lectures/add-lecture-dialog.tsx`

This file is now fully deprecated by the new page route. Delete it. Confirm no other files import it before deletion.

---

## Phase 5: Badge Rendering Specification (for Quiz Phase — document only)

> Implementation of the full quiz phase is out of scope for this feature. The following is **specification for the future implementer**, not work to be done now.

- In the quiz view component, import `Badge` from `@/components/ui/badge`.
- For each question before rendering it, render the appropriate badge:
  - `type === "single"` → `<Badge variant="secondary">Single Choice</Badge>`
  - `type === "multi"` → `<Badge variant="outline">Multiple Choice</Badge>`
  - `type === "case"` → `<Badge variant="destructive">Clinical Case</Badge>` (or amber if a custom variant is added)
- After quiz completion, render all `reflectionQuestions` in a titled section: each item shows `question` then `modelAnswer`.

---

## Verification Plan

### Manual Testing Steps

1. **Schema gate**: Run `npm run build` after updating the schema. TypeScript compiler must pass with zero errors.
2. **Navigation**: On Subjects page, click "Add Lecture" — verify it navigates to the new route (not a dialog).
3. **Copy Prompt**: Click "Copy Magic Prompt" — paste into Notepad and confirm the full Dr. Molar prompt is present.
4. **Happy path**: Paste a valid JSON payload (pre-generated test fixture) and submit. Verify the lecture appears in the Subjects page and in Firestore console.
5. **Invalid JSON**: Paste `{ broken json }` and submit. Verify toast appears: "Invalid JSON..." and no Firestore write occurs.
6. **Schema validation failure**: Paste valid JSON but with only 2 reflection questions. Verify Zod error toast appears.
7. **Empty textarea**: Click submit without pasting anything. Verify guard toast appears.

### Pre-Implementation Checklist

- [ ] Confirm `add-lecture-dialog.tsx` has no other importers before deleting.
- [ ] Confirm `src/types/lecture.ts` changes don't break any existing consumers (e.g., quiz pages).
