# Implementation Plan: Phase 3 — Workspace Navigation, JSON Ingestion & Study Loop

**Branch**: `003-workspace-nav-json-study` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)

---

## Summary

This phase introduces a major structural pivot:
1. **Admin Power**: Introducing an `admin` role with a strictly protected `/admin` dashboard and a "Global Data Seeding" utility.
2. **Subject-Centric Ingestion**: "Add Lecture" is moved to the Subjects page, triggered per subject for automatic ID assignment.
3. **Dynamic Workspace Setup**: Workspace creation now fetches available subjects from a global `core_subjects` collection seeded by the admin.
4. **Study Loop**: A complete 3-step loop (Intro → Timer → Completion) with `framer-motion` transitions.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict)  
**Primary Dependencies**: Next.js 15 (App Router), `shadcn/ui`, `framer-motion`, `zod`, `firebase`  
**Storage**: 
- `/workspaces/{id}/subjects/{id}/lectures` (Lectures)
- `/subjects` (Workspace Subjects)
- `/core_subjects` (Global Reference List)
**Access Control**: User-based role checking (`user.role === 'admin'`).

---

## Project Structure

### Source Code Changes

```text
src/
├── app/(protected)/
│   ├── admin/
│   │   └── page.tsx                           [NEW] Admin Dashboard (Seeding utility)
│   ├── workspaces/[workspaceId]/
│   │   ├── board/page.tsx                     [NEW] Whiteboard placeholder
│   │   └── subjects/page.tsx                  [MODIFY] Subjects list + "Add Subject" + "Add Lecture" trigger
│   └── subjects/
│       └── [subjectId]/lectures/[lectureId]/
│           └── page.tsx                       [NEW] Study Loop shell
│
├── components/
│   ├── layout/
│   │   └── sidebar.tsx                        [MODIFY] Add Admin link (conditional) + Collapsible workspaces
│   ├── workspaces/
│   │   └── create-workspace-modal.tsx         [MODIFY] Fetch from core_subjects
│   ├── lectures/
│   │   └── add-lecture-dialog.tsx             [MODIFY] Remove subject selection (passed via props)
│   └── study/                                 [NEW] Step components
```

---

## Phase 1: Foundation & Admin Essentials

### T001 — Secure Admin Route
1. Create `/app/(protected)/admin/page.tsx`.
2. Implement role check: if `user.role !== 'admin'`, `redirect("/")`.
3. Add a "Seed Core Subjects" button.

### T002 — Global Data Seeding
1. Implement `seedCoreSubjects` function using `writeBatch`.
2. Populate `core_subjects` with: Anatomy, Physiology, Histology, Dental Materials, Operative Dentistry, Prosthodontics.

### T003 — Dynamic Workspace Creation
1. Refactor `create-workspace-modal.tsx` to fetch subjects from `core_subjects` on mount.
2. Replace the hardcoded subject array with the fetched list.

---

## Phase 2: Sidebar & Subjects Page Refactor

### T004 — Sidebar Refinement
1. Implement Collapsible Workspaces (as previously planned).
2. Add a conditional "Admin" link at the top if `user.role === 'admin'`.

### T005 — Powerful Subjects Page
1. Add an "Add Subject" form/button that creates a new doc in `/subjects` tied to the current `workspaceId`.
2. Render lecture list inside each subject card.
3. "Add Lecture" button passes the `subject.id` to the dialog.

---

## Phase 3: JSON Ingestion (Subject-Centric)

### T006 — Optimized AddLectureDialog
1. Receive `subjectId` and `workspaceId` as props.
2. Validate pasted JSON with Zod (as previously defined).
3. Save to `/workspaces/[wsId]/subjects/[subId]/lectures`.

---

## Phase 4: Study Loop (Phases 6-8 from previous plan)

1. **Intro Step**: Title, summary, reflection questions.
2. **Timer Step**: `Date.now() - startTimestamp` logic (localStorage).
3. **Completion Step**: Human-readable time + action buttons.
4. **Transitions**: `framer-motion` slide/fade.

---

## Verification Checklist

| Check | Method |
|---|---|
| Admin access restricted | Login as student → try `/admin` → verify redirect |
| Data Seeding | Run seed → check Firestore `core_subjects` |
| "Add Subject" | Create subject on subjects page → verify Firestore + UI |
| Subject-centric import | Paste JSON under "Anatomy" → verify correctly filed under Anatomy |
| Timer Accuracy | Cross-tab switch verification |
