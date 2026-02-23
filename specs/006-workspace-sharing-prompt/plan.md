# Implementation Plan: Workspace Sharing & Prompt Refinement

**Branch**: `006-workspace-sharing-prompt` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-workspace-sharing-prompt/spec.md`

## Summary

This phase focuses on refactoring the AI persona to a charismatic university professor ("Dr. Molar") with a strict bilingual formatting rule for medical terminology, alongside implementing a robust workspace sharing mechanism that allows read-only members to join and consume workspaces via unique invite links.

## Technical Context

**Language/Version**: TypeScript / Next.js 14+ (App Router)
**Primary Dependencies**: React, Firebase (Firestore & Auth), `shadcn/ui`, `lucide-react`, `sonner`
**Storage**: Firebase Firestore (`workspaces` collection)
**Target Platform**: Desktop & Mobile Web
**Project Type**: Next.js Web Application
**Constraints**: Firestore security rules must strictly segment read/write access based on `ownerId` vs `memberIds`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Framework**: ✅ Next.js App Router
- **UI Components**: ✅ `shadcn/ui` Dialog, Button, Inputs
- **Backend & Auth**: ✅ Firebase Firestore used for data updates, and Firebase Auth for member joins.
- **Language**: ✅ TypeScript strict mode.

## Implementation Steps

### 1. Data Model Updates (Workspace Creation)
- Modifying the existing logic that handles creating new workspaces (e.g., inside `create-workspace-modal.tsx` or a dedicated firebase hook/utility).
- When a user creates a new workspace, the Firestore document **MUST** insert:
  - `ownerId: user.uid` (string)
  - `memberIds: []` (empty array of strings)
- Update the `Workspace` TypeScript interface in `types/workspace.ts` to include `ownerId` and `memberIds`.

### 2. Prompt Refinement (`lib/constants/prompts.ts`)
- Update the NotebookLM AI generation prompt.
- **Persona**: Change from a clinical setting to "Dr. Molar's University Lecture Hall". The tone must be a charismatic, slightly comedic professor telling engaging stories and giving practical examples to university dental students.
- **Bilingual Translation Rule**: Explicitly instruct the AI: *"When generating the Arabic translation (`ar` field), you MUST keep complex medical and dental terminology in English, but immediately follow it with a clear Arabic explanation inside parentheses. Example: 'Endodontics (علاج الجذور)'."*

### 3. Share UI & Dialog Implementation
- In the Workspace Dashboard Header (or `app/(protected)/workspaces/[workspaceId]/page.tsx`), add a "Share Workspace" button.
- Create a new `shadcn/ui` Dialog component (e.g., `ShareWorkspaceDialog`).
- The dialog should display a read-only input field with the generated invite link: `https://[domain]/workspaces/join/[workspaceId]` (or localhost for dev).
- Implement a "Copy" button that uses the browser's Clipboard API to copy the link and fires a `toast.success` notification.

### 4. Join Route Logic (`app/workspaces/join/[workspaceId]/page.tsx`)
- Create a new Next.js implicit client or server page for the join route.
- **Logic**:
  1. Ensure the user is authenticated (redirect to login/signup `/?redirect=...` if not).
  2. Verify the workspace exists by fetching the document from Firestore.
  3. Check if the user is already the owner or a member. If yes, simply redirect them to `/workspaces/[workspaceId]`.
  4. If not, use Firestore's `arrayUnion(user.uid)` to append their ID to the `memberIds` array.
  5. Show a brief loading state or success toast, and redirect to `/workspaces/[workspaceId]`.

### 5. Role-Based Access Control (RBAC) in UI
- Update the `WorkspaceProvider` or `useWorkspace` hook to cleanly expose the `role` of the active user for the current workspace (`owner` | `member`).
- Conditionally render the following UI elements so they are **HIDDEN** if the user is merely a `member` (i.e. not the `ownerId`):
  - "Add Subject" button in the Workspace Subjects page.
  - "Add Lecture" button (and its empty state placeholder) in the Subjects page.
  - Delete buttons for both Subjects and Lectures.
  - The "Share Workspace" button (only the owner should be generating/seeing the invite link).

## Project Structure

### Documentation (this feature)

```text
specs/006-workspace-sharing-prompt/
├── spec.md              
├── data-model.md        
├── checklists/requirements.md
├── plan.md              # This file
└── tasks.md             # (Will be generated next)
```

### Source Code Targets

```text
src/
├── app/(protected)/workspaces/
│   ├── [workspaceId]/page.tsx
│   ├── [workspaceId]/subjects/page.tsx
│   └── join/[workspaceId]/page.tsx      # [NEW]
├── components/
│   └── workspaces/
│       ├── share-workspace-dialog.tsx   # [NEW]
│       └── create-workspace-modal.tsx   # [MODIFY]
├── lib/
│   ├── constants/prompts.ts             # [MODIFY]
│   └── firebase/workspaces.ts           # [MODIFY] 
└── types/
    └── workspace.ts                     # [MODIFY]
```

**Structure Decision**: A new `join` route is added inside the protected workspaces directory to leverage existing authentication wrappers. The `prompts.ts` file is updated natively, and the data model interfaces are expanded to accommodate the ownership and array membership.
