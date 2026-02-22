# Tasks: Add Lecture via NotebookLM

**Feature**: `004-add-lecture-notebooklm`  
**Input**: Design documents from `specs/004-add-lecture-notebooklm/`  
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md) | **Data Model**: [data-model.md](./data-model.md)

---

## ⚠️ Flash Agent Guardrails

> **Read before implementing ANYTHING.**

1. **shadcn/ui ONLY**: Use `Button`, `Card`, `Textarea`, `Input`, `Badge`, `Skeleton` from `shadcn/ui`. Do NOT create custom raw HTML UI primitives.
2. **Strict TypeScript**: All new files MUST use explicit types/interfaces. No `any`, no `// @ts-ignore`.
3. **Zod validation BEFORE Firestore**: The JSON payload MUST pass `LectureImportSchema.safeParse()` successfully before `addDoc()` is ever called. A failed parse MUST show a user-visible toast and `return` early.
4. **Notion-like aesthetic**: Clean, minimal, breathable layout. Use `space-y-*` and `Card` components for structure. No shadow-heavy or cluttered designs.
5. **App Router only**: All new pages are in `src/app/(protected)/`. No `pages/` directory.
6. **Delete deprecated code**: `add-lecture-dialog.tsx` MUST be deleted. Do not leave dead code.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pre-implementation audit and cleanup before making any changes.

- [x] T001 Audit all files importing `AddLectureDialog` from `src/components/lectures/add-lecture-dialog.tsx` — found in `SubjectsPage` and `WorkspacePage`
- [x] T002 Audit all files importing from `src/types/lecture.ts` and `src/lib/validations/lecture.ts` — found in `SubjectsPage` and `AddLectureDialog`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and data contracts that EVERY subsequent phase depends on. Must be completed and verified before any UI work begins.

⚠️ **CRITICAL**: No user story implementation can begin until this phase is complete.

- [ ] T003 Replace entire `src/lib/validations/lecture.ts` with the new Zod schema:
  - `ReflectionQuestionSchema`: `{ question: string, modelAnswer: string }`
  - `QuizQuestionSchema`: `{ type: z.enum(["single","multi","case"]), question, options (min 4, max 5), correctAnswers: number[], explanation }`
  - `LectureImportSchema`: `{ title, intro, reflectionQuestions: length(4), quiz: min(20).max(25) }`
  - Export: `LectureImport`, `QuizQuestion`, `ReflectionQuestion` types
- [ ] T004 Replace entire `src/types/lecture.ts` with new TypeScript interfaces:
  - `QuestionType = "single" | "multi" | "case"`
  - `ReflectionQuestion { question, modelAnswer }`
  - `QuizQuestion { type: QuestionType, question, options, correctAnswers: number[], explanation }`
  - `Lecture { id, workspaceId, subjectId, title, intro, reflectionQuestions, quiz, createdAt }`
- [ ] T005 Fix any TypeScript errors introduced in T003/T004 in existing consumers found in T002 (e.g., quiz pages referencing old `correctAnswer: string` or old `reflectionQuestions: string[]`)

**Checkpoint**: Run `npm run build` — zero TypeScript errors before proceeding.

---

## Phase 3: User Story 1 — Add Lecture via NotebookLM Workflow (Priority: P1) 🎯 MVP

**Goal**: A user can navigate to the new full-page Add Lecture route, copy the Dr. Molar prompt, paste NotebookLM output, and have it validated and saved to Firestore under the correct workspace/subject.

**Independent Test**: Navigate to `/workspaces/[anyId]/subjects/[anyId]/add-lecture`. Verify the 4-step layout renders. Copy prompt, paste valid JSON, submit — verify lecture appears in Subjects page and in Firestore console.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create `src/lib/constants/prompts.ts` with the `NOTEBOOK_LM_PROMPT` constant:
  - Export a single `const NOTEBOOK_LM_PROMPT: string` template literal
  - Content: The full "Dr. Molar" prompt from `specs/004-add-lecture-notebooklm/spec.md` (Section: The NotebookLM Prompt)
  - No other logic in this file

- [ ] T007 [US1] Create `src/app/(protected)/workspaces/[workspaceId]/subjects/[subjectId]/add-lecture/page.tsx`:
  - `"use client"` directive at top
  - Use `useParams()` to extract `workspaceId` and `subjectId`
  - Use `useRouter()` for post-submit navigation
  - Import `NOTEBOOK_LM_PROMPT` from `@/lib/constants/prompts`
  - Import `LectureImportSchema` from `@/lib/validations/lecture`
  - Import `db` from `@/lib/firebase`
  - Import `addDoc`, `collection`, `serverTimestamp` from `firebase/firestore`
  - Import `toast` from `sonner`
  - Manage state: `rawJson: string`, `lectureTitle: string`, `submitting: boolean`, `copied: boolean`

- [ ] T008 [US1] Implement the 4-step UI layout in the Add Lecture page (depends on T007):
  - **Page Header**: `← Back` link (uses `router.back()`) + main title "✨ Add a New Lecture" + subtitle copy
  - **Step 1 Card** — "How to Summon Your Lecture 🧙":
    - Heading: "Step 1 — Prepare the Oracle"
    - Body: Engaging, funny text explaining the NotebookLM copy-paste workflow in 3-4 sentences. Mention that NotebookLM cannot be embedded (it's too powerful to be contained in an iframe).
  - **Step 2 Card** — "Open NotebookLM":
    - Heading: "Step 2 — Enter the Oracle"
    - A `Button` using `asChild` wrapping an `<a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer">` with an external link icon
  - **Step 3 Card** — "Copy the Magic Prompt":
    - Heading: "Step 3 — Arm Yourself"
    - A "Copy Magic Prompt 📋" `Button`. On click: `navigator.clipboard.writeText(NOTEBOOK_LM_PROMPT)`, then set `copied = true`, show `toast.success("Prompt copied! Paste it into NotebookLM.")`. Reset `copied` to `false` after 2 seconds.
    - When `copied === true`, show "Copied ✓" label on button.
    - A small `Card`/`pre` block showing only the first 3 lines of `NOTEBOOK_LM_PROMPT` in monospace as a preview
  - **Step 4 Card** — "Paste & Summon":
    - Heading: "Step 4 — Paste the Result"
    - A labeled `Input` for `lectureTitle` ("Lecture Title")
    - A large `Textarea` (min-h-[280px], font-mono class, rows=14) with placeholder "Paste your JSON here..."
    - `value={rawJson}` and `onChange={(e) => setRawJson(e.target.value)}`
    - A full-width primary `Button` "Generate Lecture →" with `disabled={submitting}` and a spinner `<Loader2 className="animate-spin">` when `submitting === true`

- [ ] T009 [US1] Implement `handleSubmit` function in Add Lecture page (depends on T007, T008):
  - Guard 1: If `lectureTitle.trim()` is empty → `toast.error("Please enter a lecture title.")` and return
  - Guard 2: If `rawJson.trim()` is empty → `toast.error("Please paste the JSON output from NotebookLM.")` and return
  - `setSubmitting(true)`
  - Try block:
    - `const parsed = JSON.parse(rawJson)` — catch `SyntaxError` → `toast.error("Invalid JSON. Check the output from NotebookLM for extra text.")` → `return`
    - `const result = LectureImportSchema.safeParse({ ...parsed, title: lectureTitle })`
    - If `!result.success` → `toast.error(result.error.errors[0]?.message ?? "Validation failed.")` → `return`
    - `await addDoc(collection(db, "workspaces", workspaceId, "subjects", subjectId, "lectures"), { ...result.data, workspaceId, subjectId, createdAt: serverTimestamp() })`
    - `toast.success("Lecture added successfully!")`
    - `router.push(`/workspaces/${workspaceId}/subjects`)`
  - Finally block: `setSubmitting(false)`

**Checkpoint**: Full Add Lecture workflow should be functional end-to-end. Test with both valid and invalid JSON payloads.

---

## Phase 4: Navigation Refactor — Remove Dialog (Priority: P1, paired)

**Goal**: Clean up the Subjects page and Workspace Dashboard to use the new route instead of the deprecated dialog.

**Independent Test**: Click "Add Lecture" button on either Subjects page or Workspace Dashboard — it navigates to the new route rather than opening a modal.

- [ ] T010 [US1] Modify `src/app/(protected)/workspaces/[workspaceId]/subjects/page.tsx` to use `router.push()`
- [ ] T010.1 [US1] Modify `src/app/(protected)/workspaces/[workspaceId]/page.tsx` to use `router.push()`
- [ ] T011 [US1] Delete `src/components/lectures/add-lecture-dialog.tsx`

**Checkpoint**: Subjects page compiles cleanly. "Add Lecture" navigates. `add-lecture-dialog.tsx` no longer exists.

---

## Phase 5: User Story 2 — Quiz Badge Rendering Specification (Priority: P2)

**Goal**: Document badge rendering for quiz question types as a forward-looking spec. No UI implementation in this phase — the quiz page is out of scope for this feature.

**Independent Test**: This is a documentation/specification task only.

- [ ] T012 [P] [US2] Add a `## Quiz Badge Rendering Spec` comment block in `src/types/lecture.ts`:
  - Document that when rendering a quiz question, the `type` field determines the `Badge` variant:
    - `"single"` → `<Badge variant="secondary">Single Choice</Badge>`
    - `"multi"` → `<Badge variant="outline">Multiple Choice</Badge>`
    - `"case"` → `<Badge variant="destructive">Clinical Case</Badge>` (amber if custom variant available)
  - Document that `reflectionQuestions` are displayed post-quiz on the results screen with `question` + `modelAnswer`

---

## Phase 6: User Story 3 — Reflection Self-Assessment Display (Priority: P3)

**Goal**: Document the post-quiz self-assessment display spec. No UI implementation in this phase.

**Independent Test**: Documentation task only.

- [ ] T013 [P] [US3] Add a JSDoc/TSDoc comment to the `Lecture` interface in `src/types/lecture.ts` for the `reflectionQuestions` field:
  - Specify: "Displayed post-quiz. Each item renders the `question`, then a collapsible or auto-revealed `modelAnswer`. The first question is the conceptual hook."

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T014 [P] Run `npm run build` to confirm zero TypeScript errors across all modified/created files
- [ ] T015 Verify Firestore data in the console: a submitted lecture must appear at `workspaces/{wid}/subjects/{sid}/lectures/{lid}` with all expected fields
- [ ] T016 [P] Confirm dark mode renders correctly on the Add Lecture page (all Cards, Textarea, Buttons must respect `dark:` variants)
- [ ] T017 [P] Confirm the "Copy Magic Prompt" button works on HTTPS (Clipboard API requires secure context — ensure dev server is accessed over localhost, which is treated as secure)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — audit first
- **Phase 2 (Foundational)**: Depends on Phase 1 audit completion. **BLOCKS all phases**
- **Phase 3 (US1 — Add Lecture Page)**: Depends on Phase 2 completion
- **Phase 4 (Subjects Refactor)**: Depends on Phase 2. Can start concurrently with Phase 3 (different files)
- **Phases 5 & 6 (US2 & US3 specs)**: Can run in parallel with Phase 3 (documentation only, no code)
- **Phase 7 (Polish)**: Depends on all phases complete

### Within Phase 3

```
T006 (prompts.ts) ──────────────────────────────────────┐
                                                         ↓
T007 (page scaffold) → T008 (4-step UI) → T009 (submit handler)
```

### Parallel Opportunities

- T006 (prompts constant) and T010 (subjects page refactor) can run in parallel — different files
- T012 and T013 (documentation tasks) can run in parallel with any phase

---

## Implementation Strategy

### MVP (User Story 1 only)

1. ✅ Phase 1: Audit imports
2. ✅ Phase 2: Update schema + types + fix consumers
3. ✅ Phase 3: Build Add Lecture page (T006 → T007 → T008 → T009)
4. ✅ Phase 4: Refactor Subjects page, delete dialog
5. **STOP and VALIDATE**: Test the full Add Lecture workflow end-to-end
6. Phases 5-7: Documentation and polish

### Task Count Summary

| Phase | Tasks | User Story | Can Parallelize |
|-------|-------|-----------|----------------|
| Phase 1 (Audit) | T001–T002 | Foundation | No |
| Phase 2 (Schema) | T003–T005 | Foundation | No |
| Phase 3 (Add Lecture Page) | T006–T009 | US1 | T006 is parallel |
| Phase 4 (Subjects Refactor) | T010–T011 | US1 | Parallel with Phase 3 |
| Phase 5 (Badge Spec) | T012 | US2 | Yes |
| Phase 6 (Reflection Spec) | T013 | US3 | Yes |
| Phase 7 (Polish) | T014–T017 | N/A | T014, T016, T017 parallel |
| **Total** | **17 tasks** | | |
