# Tasks: Phase 2 — Workspaces & Dashboard

**Feature Branch**: `002-workspaces-dashboard`
**Input design documents**: `specs/002-workspaces-dashboard/plan.md`, `spec.md`, `data-model.md`, `research.md`

---

## ⚠️ FLASH GUARDRAILS
... (existing guardrails)

---

## Phase 1 & 2: Completed Foundation ✅
- [x] T001–T012 Setup, Auth, Firestore, Workspace Foundation

---

## Phase 2A: Priority Amendments ✅
- [x] T012.1–T012.6 UserNav, Modal, Dental subjects, Batch Write

---

## Phase 3: Architectural Pivot & Hub UI (New Roadmap) 🚀

**Purpose**: Move analytics to scoped views and create a central navigation hub.

- [ ] T031 Refactor: Move Charts from `src/app/(protected)/page.tsx` to `src/app/(protected)/workspaces/[workspaceId]/page.tsx`
- [ ] T032 Hub UI: Transform root dashboard into Workspace Card Grid + Global Stats (mock)
- [ ] T033 Sidebar UX: Workspace items -> minimal links with `ChevronRight` icon

---

## Phase 4: US3 — Add a Lecture 🚀

- [ ] T034 [US3] Create `src/components/lectures/add-lecture-dialog.tsx` (Dialog + Textarea UI)
- [ ] T035 [US3] Integrate "Add Lecture" button into `workspaces/[workspaceId]/page.tsx`

---

## Phase 5: Polish & Final Review

- [ ] T036 Final visual polish and build check
