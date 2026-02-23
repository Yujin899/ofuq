---
description: "Task list for Phase 6 - Workspace Sharing & Prompt Refinement"
---

# Tasks: Workspace Sharing & Prompt Refinement

**Input**: Design documents from `/specs/006-workspace-sharing-prompt/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md

> **⚡ FLASH GUARDRAILS - CRITICAL DIRECTIVES ⚡**
> - **UI Kit**: You MUST use `shadcn/ui` components exclusively. Do not build custom dialogs or buttons if a primitive exists.
> - **TypeScript**: Strict typing required. Ensure all Firebase payloads and component props are properly typed.
> - **Security Rules Awareness**: Remember that the UI logic (hiding buttons) must mimic the database backend constraints. Only the `ownerId` has write access.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Project initialization and basic structure.
*(No setup tasks required for this feature as the project is already initialized.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model updates that MUST be complete before the sharing UX can be implemented.

- [x] T001 Update `Workspace` interface in `src/types/workspace.ts` to require `ownerId` (string) and `memberIds` (string array).
- [x] T002 Update workspace creation logic in `src/components/workspaces/create-workspace-modal.tsx` (via WorkspaceProvider) to automatically set `ownerId: user.uid` and `memberIds: []` on new documents.
- [x] T003 Update workspace fetching hooks (e.g., `useWorkspace`) to surface the current user's role (`owner` vs `member`).

**Checkpoint**: New workspaces are created with correct ownership data, enabling RBAC logic.

---

## Phase 3: User Story 1 - Workspace Owner Shares Workspace (Priority: P1)

**Goal**: Workspace owners can generate and copy an invite link.

**Independent Test**: Click "Share Workspace" on the dashboard and verify the link is correctly copied to the clipboard.

### Implementation for User Story 1

- [x] T004 [US1] Create `ShareWorkspaceDialog` component in `src/components/workspaces/share-workspace-dialog.tsx` using `shadcn/ui` Dialog, Input (read-only), and Button (Clipboard API).
- [x] T005 [US1] Inject "Share Workspace" trigger button into the workspace header in `src/app/(protected)/workspaces/[workspaceId]/page.tsx` (Only visible to `ownerId`).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently by generating links.

---

## Phase 4: User Story 2 - User Joins Shared Workspace (Priority: P1)

**Goal**: Allow peers/students to join a shared workspace using an invite link and experience read-only access.

**Independent Test**: Navigate to the generated `/workspaces/join/[id]` link as a secondary user, wait for the processing redirect, and verify "Add" buttons are missing from the Subjects page.

### Implementation for User Story 2

- [x] T006 [US2] Create new Next.js route file at `src/app/(protected)/workspaces/join/[workspaceId]/page.tsx`.
- [x] T007 [US2] Implement Firebase transaction/update logic in the join route to add `user.uid` to `memberIds` array using `arrayUnion`, handling existing members gracefully, then redirect.
- [x] T008 [P] [US2] Hide the "Add Subject", "Add Lecture", and "Delete" buttons in `src/app/(protected)/workspaces/[workspaceId]/subjects/page.tsx` for users who are just members.
- [x] T009 [P] [US2] Ensure any workspace dashboard settings/destructive actions are hidden from members in `src/app/(protected)/workspaces/[workspaceId]/page.tsx`.

**Checkpoint**: The core workspace sharing architecture is now complete. Secondary users can view, but cannot modify.

---

## Phase 5: User Story 3 - Engaging AI Study Content (Priority: P2)

**Goal**: Refine the NotebookLM output prompt for better storytelling and standardizing bilingual medical formatting.

**Independent Test**: Generate a lecture json and verify the medical terms retain English wrappers with Arabic translations in parentheses.

### Implementation for User Story 3

- [x] T010 [US3] Update `src/lib/constants/prompts.ts`. Modify the persona to "Dr. Molar's University Lecture Hall" and inject the strict bilingual rule: *"When generating the Arabic translation (`ar` field), you MUST keep complex medical and dental terminology in English, but immediately follow it with a clear Arabic explanation inside parentheses. Example: 'Endodontics (علاج الجذور)'."*

**Checkpoint**: Prompt engineering complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanups enforcing design and data rules.

- [x] T011 Verify UI styling for the Share Dialog follows the clean Notion-like minimal aesthetic.
- [x] T012 Confirm Firebase read rules explicitly allow `memberIds` to read workspace contents (Conceptual check or rule deployment if rules are managed locally).

---

## Implementation Strategy

### MVP First (Sharing Mechanics)
1. Complete Phase 2: Foundational (Data Model).
2. Complete Phase 3 & 4: Invite Generation and Join routing.
3. Test the full sharing lifecycle.

### Follow-up Improvements
1. Complete Phase 5: Prompt Refinement.
2. Final UX polish.
