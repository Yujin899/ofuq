# Feature Specification: Phase 6 - Workspace Sharing & Prompt Refinement

**Feature Branch**: `006-workspace-sharing-prompt`  
**Created**: 2026-02-23  
**Status**: Draft  
**Input**: User description: "Write the detailed Feature Specification for Phase 6 - Workspace Sharing & Prompt Refinement..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Workspace Owner Shares Workspace (Priority: P1)

As a workspace owner, I want to be able to generate an invite link for my workspace, so that I can share it with my peers or students.

**Why this priority**: Without the ability to invite others, the workspace sharing mechanism cannot function. This is the entry point to the sharing architecture.

**Independent Test**: Can be fully tested by clicking a "Share Workspace" button on the Workspace Dashboard, generating a UI dialog with a unique join link, and copying that link to the clipboard.

**Acceptance Scenarios**:

1. **Given** a user is an owner of a workspace and is on the Workspace Dashboard, **When** they click "Share Workspace", **Then** a dialog appears displaying a unique join link (`/workspaces/join/[workspaceId]`).
2. **Given** the share dialog is open, **When** the user clicks the copy button, **Then** the link is copied to their clipboard and they receive a success confirmation.

---

### User Story 2 - User Joins Shared Workspace (Priority: P1)

As a student, I want to click on a workspace invite link and join it as a read-only member, so I can access and consume the owner's study materials.

**Why this priority**: The core value proposition of workspace sharing is allowing secondary users to consume the learning materials without modifying them.

**Independent Test**: Can be fully tested by taking a generated invite link, visiting it as a logged-in user who is not the owner, and successfully gaining access to the shared workspace.

**Acceptance Scenarios**:

1. **Given** a logged-in user visits a valid `/workspaces/join/[workspaceId]` link, **When** the page loads, **Then** the system verifies the workspace exists, adds them to the `memberIds` array in the database, and redirects them to the Workspace Dashboard.
2. **Given** a user is on a shared Workspace Dashboard, **When** they attempt to view subjects, take lectures, or use the timer, **Then** they can do so successfully.
3. **Given** a user is a member (not owner) on a shared Workspace Dashboard, **When** they look for "Add Lecture" or "Add Subject" buttons, **Then** these buttons are completely hidden from the UI.
4. **Given** an unauthenticated user visits a join link, **When** the page loads, **Then** they are redirected to login/signup, after which they should be able to join the workspace.

---

### User Story 3 - Engaging AI Study Content (Priority: P2)

As a dental student taking a lecture, I want the AI-generated study material to be delivered in an engaging, charismatic, professor-like tone with accurate medical bilingual support.

**Why this priority**: Improves the consumption experience for both owners and members. Crucial for educational retention, specifically tailored to the "Dr. Molar" University persona.

**Independent Test**: Can be fully tested by generating a new lecture and reviewing the output prompt tone and language formatting.

**Acceptance Scenarios**:

1. **Given** a user processes a new document into a lecture, **When** the AI generates the study loop content, **Then** the tone reflects a charismatic university professor delivering a lecture hall story.
2. **Given** the AI generates Arabic translations for the study loop, **When** it encounters complex medical/dental terminology, **Then** it must keep the English term and immediately follow it with the Arabic explanation in parentheses (e.g., "Endodontics (علاج الجذور)").

### Edge Cases

- What happens when a user attempts to join a workspace they are already a member of? (Should silently redirect to the workspace dashboard without duplicating the member ID).
- What happens when an invalid or deleted workspace join link is visited? (Should show a friendly error/not-found message and redirect to the user's main dashboard).
- What happens if a non-owner forcefully attempts to hit the backend service to create a subject/lecture in a shared workspace? (Database-level security rules should explicitly reject the write request).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support generating a unique join link for any workspace via a "Share Workspace" button in the Dashboard header.
- **FR-002**: The system MUST validate incoming join link requests, adding the user's ID to the workspace's `memberIds` array if valid.
- **FR-003**: The system MUST restrict UI write actions ("Add Subject", "Add Lecture") so they are only visible to the user whose ID matches the workspace `ownerId`.
- **FR-004**: The system MUST allow members (users in `memberIds`) to natively read all subjects, lectures, and use the study loop/timer within the workspace.
- **FR-005**: The system MUST enforce database-level security rules, guaranteeing writes are only permitted for the `ownerId` and reads are permitted for the `ownerId` and all `memberIds`.
- **FR-006**: The AI generation prompt MUST be updated to enforce the "Dr. Molar" University Lecture Hall persona (charismatic, comedic professor tone).
- **FR-007**: The AI generation prompt MUST be updated to enforce the bilingual translation rule for medical terms: English term followed immediately by Arabic explanation in parentheses.

### Key Entities

- **Workspace**: Upgraded to include ownership and membership arrays.
  - `ownerId` (string): The creator and sole administrator of the workspace.
  - `memberIds` (array of strings): Users who have joined the workspace with read-only permissions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A workspace owner can generate and copy a join link within 2 clicks from the Dashboard.
- **SC-002**: A visiting user can join a workspace and view its contents in under 3 seconds after clicking the invite link.
- **SC-003**: 100% of unauthorized API write attempts by a workspace member are successfully blocked by database security rules.
- **SC-004**: AI-generated content formatting compliance: 100% of newly generated lectures strictly follow the `English Term (Arabic Translation)` format for complex dental/medical terminology in their Arabic fields.
