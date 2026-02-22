# Feature Specification: Phase 3 — Workspace Navigation, JSON Ingestion & Study Loop

**Feature Branch**: `003-workspace-nav-json-study`  
**Created**: 2026-02-22  
**Status**: Draft  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Collapsible Workspace Navigation (Priority: P1)

A dental student opens the app and sees the sidebar listing their workspaces. They click on a workspace name to expand it and reveal three nested navigation items: **Overview**, **Subjects & Lectures**, and **Whiteboard**. They click "Subjects & Lectures" and are taken to the correct page for that workspace.

**Why this priority**: Navigation is the foundation of the entire workspace experience. Without this, users cannot discover or navigate to any workspace-specific content. Blocking dependency for US2 and US3.

**Independent Test**: A user with at least one workspace can expand it in the sidebar, see nested links, and click each to be taken to the correct URL.

---

### User Story 2 — Subject-Centric "Add Lecture" (Priority: P1)

A student navigates to "Subjects & Lectures" for their workspace. They see a list of their subjects (e.g., "Anatomy", "Physiology"). Each subject has its own "Add Lecture" button. They click it, paste their NotebookLM JSON, and the lecture is saved directly into that specific subject's collection.

**Why this priority**: Direct subject-to-lecture mapping reduces friction and avoids manual subject selection within the dialog.

---

### User Story 3 — Workspace "Add Subject" (Priority: P1)

A student on the "Subjects & Lectures" page notices they need a new subject. They click a global "Add Subject" button on the page, type the name, and it immediately appears in the list, ready for lectures.

**Why this priority**: Enables dynamic workspace growth without returning to the initial creation flow.

---

### User Story 4 — Admin Role & Data Seeding (Priority: P1)

An administrator logs in and sees an "Admin" link in the navigation (only visible to admins). They access `/admin` and click "Seed Core Subjects". This populates a global `core_subjects` collection with the 6 standard dental subjects.

**Why this priority**: Standardizes the subject list for all users and enables the "Select Subjects" feature in workspace creation to be dynamic.

---

### User Story 5 — Study Loop: Step 1 (Intro Page) (Priority: P2)

[Content same as previous version]

---

### User Story 6 — Study Loop: Step 2 (Timer Page) (Priority: P2)

[Content same as previous version]

---

### User Story 7 — Study Loop: Step 3 (Completion Screen) (Priority: P2)

[Content same as previous version]

---

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & Access Control**

- **FR-001**: The sidebar MUST display each workspace as a collapsible item.
- **FR-002**: Each workspace MUST show: "Overview", "Subjects & Lectures", and "Whiteboard".
- **FR-003**: The system MUST verify a `role: "admin"` field in the user's Firestore document before allowing access to `/admin`.
- **FR-004**: Non-admins attempting to access `/admin` MUST be redirected to `/`.

**Subjects & Lectures Management**

- **FR-005**: The `/workspaces/[id]/subjects` page MUST display a list of all subjects in that workspace.
- **FR-006**: Each subject in the list MUST have a dedicated "Add Lecture" button that automatically passes the `subjectId`.
- **FR-007**: The page MUST include an "Add Subject" button to create new subject documents at `/subjects` (with `workspaceId` reference).

**Admin & Seeding**

- **FR-008**: The `/admin` dashboard MUST include a "Seed Core Subjects" button.
- **FR-009**: The Seed action MUST trigger a batch write to `core_subjects` with: Anatomy, Physiology, Histology, Dental Materials, Operative Dentistry, Prosthodontics.
- **FR-010**: **Workspace Creation Modal** MUST fetch available subjects from the `core_subjects` collection instead of using hardcoded arrays.

**JSON Ingestion & Study Loop**

- [Same requirements as previous version for FR-011 through FR-025]

### Key Entities

- **Core Subject**: A global document in `core_subjects` used to populate the workspace creation list.
- **User**: Updated to include `role: "admin" | "student"` (default student).
- **Lecture**: [Same as previous]
- **StudySession**: [Same as previous]

---

## Success Criteria *(mandatory)*

- **SC-001**: Users cannot access the admin dashboard without the correct role.
- **SC-002**: "Add Lecture" button correctly assigns the parent `subjectId` without user input.
- **SC-003**: Workspace creation checkboxes dynamically update when `core_subjects` change in Firestore.
- [Same SCs as previous for Timer, Validation, and Transitions]

---

## Assumptions

- Users with existing accounts will need their `role` field manually set to `admin` in Firestore by a developer (or through a one-time migration) to test the Admin UI.
- `core_subjects` is a separate top-level collection.
- [Same assumptions as previous for framer-motion and local storage]
