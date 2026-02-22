# Tasks: Phase 3 — Architectural Pivot & Study Loop

## Feature: Workspace Navigation, JSON Ingestion & Study Loop
**Status**: In Progress (Revised)

---

## Phase 1: Foundation & Admin Setup
*Goal: Secure the admin route and implement the data seeding pipeline.*

- [x] T001 [P] [US1] Secure `/admin` route:
  - Create `src/app/(protected)/admin/page.tsx`
  - Implement role check: `if (user.role !== 'admin') redirect('/')`
  - Render "Admin Dashboard" title
- [x] T002 [P] [US4] Implement Global Data Seeding:
  - Create button "Seed Core Subjects" in `/admin`
  - Implement `seedCoreSubjects` utility in `src/lib/firebase/seeding.ts`
  - Execute a `writeBatch` to populate `core_subjects` (6 dental subjects)
- [x] T003 [P] [US1] Add Admin link to Sidebar:
  - Conditionally render "Admin" link at the top of the sidebar only for `role === 'admin'`

---

## Phase 2: Dynamic Workspace Creation
*Goal: Remove hardcoded subjects and fetch from the global core list.*

- [ ] T004 [P] [US4] Update `src/components/workspaces/create-workspace-modal.tsx`:
  - Fetch documents from `core_subjects` on mount
  - Replace hardcoded subjects array with the fetched list for checkboxes
  - Ensure the selection logic still works with the dynamic data

---

## Phase 3: Subject-Centric Workspace Management
*Goal: Add "Add Subject" and per-subject "Add Lecture" triggers.*

- [x] T005 [P] [US1] Sidebar: Collapsible Workspace Navigation (Implemented)
- [ ] T006 [P] [US3] "Add Subject" on `/workspaces/[id]/subjects`:
  - Add a button/dialog to create a new subject in that workspace
  - Add the new doc to `/subjects` with `workspaceId` and `name`
- [ ] T007 [P] [US2] Subject-Centric "Add Lecture":
  - Update `src/app/(protected)/workspaces/[id]/subjects/page.tsx`
  - Map through subjects and render an "Add Lecture" button inside each subject card
  - Pass the specific `subjectId` to the `AddLectureDialog`

---

## Phase 4: Zod-Validated JSON Ingestion (Refined)
*Goal: Finalize the ingestion pipeline.*

- [x] T008 [P] [US2] Create Zod Schema and Types (Implemented)
- [x] T009 [P] [US2] Update `AddLectureDialog.tsx` with validation and Firestore write (Implemented - pending prop check)
- [ ] T010 [P] [US2] Finalize Ingestion logic:
  - Ensure `workspaceId` and `subjectId` are correctly received from the parent trigger

---

## Phase 5: Study Loop UI (Step 1-3)
*Goal: Implement the animated 3-step study cycle.*

- [ ] T011 [P] [US5] Study Loop: Intro Page (`intro-step.tsx`):
  - Display title, intro summary, and 3 reflection questions
- [ ] T012 [P] [US6] Study Loop: Timer Logic (`use-study-timer.ts`):
  - Implement accurate timer using `Date.now() - startTimestamp`
  - Persist to `localStorage`
  - Implement 25-minute motivational toast
- [ ] T013 [P] [US6] Study Loop: Timer Page (`timer-step.tsx`):
  - Monospace large display with `HH:MM:SS`
- [ ] T014 [P] [US7] Study Loop: Completion Page (`completion-step.tsx`):
  - Session summary + action buttons ("Take Quiz" placeholder, "Return")
- [ ] T015 [P] [US5/6/7] Study Loop Shell:
  - Integrate `AnimatePresence` for step transitions in `[lectureId]/page.tsx`
