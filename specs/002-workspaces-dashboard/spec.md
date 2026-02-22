# Feature Specification: Phase 2 — Workspaces & Dashboard

**Feature Branch**: `002-workspaces-dashboard`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Phase 2 — Workspaces & Dashboard for the Ofuq e-learning workspace platform"

> **Cross-Phase Note**: This specification also contains **retroactive amendments to Phase 1** (`001-foundation-auth`). Those changes are collected in the dedicated section below and must be applied to the Phase 1 implementation before Phase 2 begins.

---

## Retroactive Amendments to Phase 1 (`001-foundation-auth`)

The following are architectural corrections to Phase 1 decisions, made in light of the broader product vision established in Phase 2.

### Amendment A — Language Enforcement

- **Change**: The HTML root element MUST have `lang="en"`. The entire application is strictly English-only. No Arabic or mixed-language strings may appear in the UI (logos/branding are exempt).
- **Rationale**: Internationalization baseline must be established before the UI grows.
- **Affected requirement**: FR-001 (project initialisation).

### Amendment B — Authentication Expansion

- **Change**: Firebase Authentication MUST support **two** sign-in methods:
  1. **Google Sign-In** (OAuth, via popup) — already implemented.
  2. **Email / Password** — **new**: users may create an account (Sign Up) or sign in with an existing one (Sign In).
- **New UI**: The `/login` page must present both options:
  - An email + password form with "Sign In" and "Sign Up" toggle.
  - A "Continue with Google" button (as a visual divider alternative).
- **New shadcn components required**: `Input`, `Label`, `Form` (for accessible, validated fields).
- **Error handling**: Incorrect credentials → inline field error. Account-already-exists → friendly message. Weak password → inline hint.
- **Rationale**: Email/password auth is required for users without Google accounts and for institutional deployments.
- **Affected requirements**: FR-005 (auth provider), FR-007 (login page).

### Amendment C — Navigation Architecture (Header → Sidebar)

- **Change**: **Remove** the top `<header>` navigation bar introduced in Phase 1 (the `UserNav` component placed in the header at `/`). Replace it with a full **Sidebar** navigation that persists across all protected routes.
- **Sidebar behaviour**:
  - On desktop (≥ 768 px): always visible as a fixed left sidebar.
  - On mobile (< 768 px): hidden by default, opened via a hamburger icon using the `shadcn/ui` **Sheet** component.
- **New shadcn component required**: `Sheet`.
- **Rationale**: The Sidebar is the primary navigation host for Phase 2+, which introduces Workspaces, Subjects, Settings, and more links. A top header cannot scale to this.
- **Affected requirement**: FR-010 (navigation/header).

---

## User Scenarios & Testing

### User Story 1 — Create and Access a Workspace (Priority: P1)

A user arrives on the dashboard for the first time and has no workspaces yet. They see a clear empty state that invites them to create their first workspace. They provide a name and the workspace is created immediately. The new workspace appears in the Sidebar's workspace switcher and the dashboard updates to reflect the selected workspace context.

**Why this priority**: Workspaces are the top-level organisational unit. Every other entity (Subjects, lectures, charts) lives inside a workspace. Without at least one workspace, the application is meaningless.

**Independent Test**: After signing in, create a workspace via the sidebar/empty state prompt, confirm the workspace name appears in the switcher, and confirm the dashboard header/title reflects the selected workspace.

**Acceptance Scenarios**:

1. **Given** the user has no workspaces, **When** the dashboard loads, **Then** an empty state is displayed prompting them to create their first workspace.
2. **Given** the empty state, **When** the user enters a workspace name and confirms, **Then** a new workspace is persisted and immediately selected.
3. **Given** the user has at least one workspace, **When** they view the Sidebar, **Then** the current workspace name is displayed in the workspace switcher.
4. **Given** multiple workspaces exist, **When** the user clicks the workspace switcher, **Then** a dropdown lists all workspaces and allows switching with a single click.

---

### User Story 2 — View Dashboard Charts (Priority: P1)

An authenticated user with an active workspace opens the dashboard at `/`. They see four analytics charts laid out in two rows. All charts display mock/placeholder data clearly labelled as such. The layout is clean, readable, and responsive.

**Why this priority**: The dashboard is the primary landing surface after sign-in. Users and stakeholders need to see the intended analytics UX from the start, even before real data exists.

**Independent Test**: After signing in with a workspace, navigate to `/` and verify all four charts render with visible mock values, correct labels, and a responsive layout at both mobile (375 px) and desktop (1280 px) widths.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** the page loads, **Then** a full-width Area Chart titled "Study Minutes" is visible at the top of the content area.
2. **Given** the user is on the dashboard, **When** the page loads, **Then** a three-column grid below the Area Chart shows: a Donut Pie Chart ("Time per Subject"), a Bar Chart ("Average Quiz Scores"), and a Radial Bar Chart ("Daily Goal").
3. **Given** any viewport width, **When** the dashboard renders, **Then** charts reflow gracefully (2-column or 1-column on smaller screens) without horizontal scrolling.
4. **Given** no real study data exists, **When** charts render, **Then** they display clearly-labelled mock data (not blank/empty states).

---

### User Story 3 — Add a Lecture (Content Ingestion UI) (Priority: P2)

A user wants to ingest a new lecture into their workspace. They click an "Add Lecture" button (visible in the Sidebar or on the Dashboard). A modal dialog opens containing a large text area where they paste raw NotebookLM JSON. They can confirm or cancel. The UI accepts the input and closes the dialog (full JSON validation and parsing are deferred to Phase 3).

**Why this priority**: This establishes the content ingestion UI contract and the dialog interaction pattern. The actual processing is out of scope for this phase, but the entry point must exist.

**Independent Test**: Click "Add Lecture", paste arbitrary text into the textarea, click "Add" (or equivalent confirm), verify the dialog closes without error, and the application does not crash.

**Acceptance Scenarios**:

1. **Given** the user is on any protected page, **When** they click "Add Lecture", **Then** a modal Dialog opens with a textarea and a title such as "Add Lecture".
2. **Given** the dialog is open, **When** the user pastes text into the textarea, **Then** the text is displayed in the field with no truncation.
3. **Given** the dialog is open, **When** the user clicks "Cancel" or presses Escape, **Then** the dialog closes without saving anything.
4. **Given** the user has entered text, **When** they click the confirm button, **Then** the dialog closes (no processing in this phase — persistence is Phase 3).

---

### User Story 4 — Sidebar Navigation (Priority: P2)

An authenticated user navigates the application via a persistent Sidebar. The Sidebar shows: the user's avatar and name (with a dropdown for Sign Out), a Workspace Switcher, and navigation links to Dashboard, Subjects (placeholder), and Settings (placeholder). On mobile, the Sidebar is hidden and opened via a hamburger button using a Sheet overlay.

**Why this priority**: The Sidebar is the global navigation host. It must exist before any page links are added in Phase 3+. This story delivers the shell without the linked-page content.

**Independent Test**: On desktop: confirm the sidebar is always visible. On mobile (375 px viewport): confirm the sidebar is hidden, a hamburger icon is present, tapping it opens a Sheet with the sidebar content, and tapping outside closes it.

**Acceptance Scenarios**:

1. **Given** the user is on any protected route, **When** the page renders on desktop, **Then** the Sidebar is permanently visible on the left edge of the viewport.
2. **Given** the user is on mobile, **When** the page renders, **Then** the Sidebar is hidden and a hamburger/menu icon is visible.
3. **Given** mobile view with Sidebar hidden, **When** the user taps the hamburger icon, **Then** a Sheet component slides in from the left showing the full Sidebar content.
4. **Given** the Sheet is open, **When** the user taps outside the sheet or a navigation link, **Then** the Sheet closes.
5. **Given** the Sidebar is visible, **When** the user clicks their avatar, **Then** a dropdown appears with their name, email, theme toggle, and a "Sign out" option.

---

### Edge Cases

- What happens if a user tries to access a workspace that has been deleted or that they no longer have access to? The system MUST redirect them to a workspace selection or creation screen.
- What happens if workspace creation fails (e.g., network error)? The user MUST see an error message and the dialog must remain open so they can retry.
- What happens if the "Add Lecture" textarea receives extremely large text (> 500 KB)? The UI MUST remain responsive; a character or size limit warning is acceptable.
- What happens when the user has exactly one workspace? The workspace switcher MUST still render (with only one item) without a dropdown option to switch.
- What happens on mobile when the Sheet is open and the user rotates to landscape? The Sheet MUST remain usable and not overflow the viewport.

---

## Requirements

### Functional Requirements

#### Phase 1 Retroactive Requirements (Amendments)

- **FR-P1-A01**: The HTML root element MUST have `lang="en"` and the application MUST render exclusively in English.
- **FR-P1-B01**: Firebase Authentication MUST support both **Google Sign-In** (OAuth) and **Email / Password** (sign-up and sign-in).
- **FR-P1-B02**: The `/login` page MUST present an email/password form (with Sign In / Sign Up toggle) **and** a "Continue with Google" button, separated by a visual divider.
- **FR-P1-B03**: Email/password form errors (wrong password, weak password, email already in use) MUST be displayed as inline field-level messages using a Sonner toast or inline text — no browser alerts.
- **FR-P1-B04**: The following additional shadcn/ui components MUST be installed for the login form: **Input**, **Label**, **Form** (which brings `react-hook-form` and `zod`).
- **FR-P1-C01**: The top-header navigation bar from Phase 1 MUST be removed and replaced by the Phase 2 Sidebar.
- **FR-P1-C02**: The **Sheet** shadcn/ui component MUST be installed and used to implement the mobile Sidebar overlay.

#### Phase 2 New Requirements

- **FR-002-01**: The system MUST define and persist a **Workspace** entity in Firestore with at minimum: `id`, `ownerId` (user uid), `name`, `createdAt`.
- **FR-002-02**: The system MUST define and persist a **Subject** entity in Firestore, linked to a Workspace, with at minimum: `id`, `workspaceId`, `name`, `createdAt`.
- **FR-002-03**: Each authenticated user MUST be able to create one or more Workspaces. Workspaces are scoped to the owner user.
- **FR-002-04**: A persistent Sidebar MUST be present on all protected routes (`/`, `/subjects`, `/settings`). It MUST contain: User profile section (avatar, name, sign-out dropdown), Workspace Switcher, and navigation links.
- **FR-002-05**: The Workspace Switcher MUST display the currently selected workspace name and, when clicked, show a list of all the user's workspaces to switch between.
- **FR-002-06**: On desktop viewports (≥ 768 px), the Sidebar MUST be statically visible. On mobile (< 768 px), the Sidebar MUST be collapsed and accessible via a hamburger icon that triggers the **Sheet** component.
- **FR-002-07**: The dashboard route `/` MUST display four analytics charts using `shadcn/ui`'s recharts wrappers:
  - Row 1: Full-width **AreaChart** labeled "Study Minutes".
  - Row 2: A responsive 3-column grid containing a **PieChart** (Donut) labeled "Time per Subject", a **BarChart** labeled "Average Quiz Scores", and a **RadialBarChart** labeled "Daily Goal".
- **FR-002-08**: All chart data MUST be sourced from a `src/lib/mock-data.ts` file in this phase. No live Firestore queries for charts.
- **FR-002-09**: An "Add Lecture" button MUST be present in the Sidebar (below navigation links) or prominently on the Dashboard.
- **FR-002-10**: Clicking "Add Lecture" MUST open a **Dialog** (shadcn/ui) containing: a title ("Add Lecture"), a `Textarea` for pasting NotebookLM JSON, and "Cancel" and "Add" buttons.
- **FR-002-11**: In this phase, clicking "Add" in the dialog MUST simply close the dialog. No JSON parsing or persistence.
- **FR-002-12**: The following additional shadcn/ui components MUST be installed: **Dialog**, **Textarea**, **Chart** (recharts wrapper).
- **FR-002-13**: The Sidebar MUST follow the Notion-like dark aesthetic: minimal borders, subdued muted-foreground text for secondary labels, and clear active-link highlighting using the `accent` colour token.
- **FR-002-14**: A `src/lib/mock-data.ts` file MUST be created with typed mock data for all four charts. The type definitions MUST be explicit (no `any`).

---

### Key Entities

- **Workspace**: The top-level organisational container for a user's study content. Key attributes: `id` (string), `ownerId` (user uid, string), `name` (string), `createdAt` (timestamp). A user may own multiple workspaces.
- **Subject**: A thematic grouping within a Workspace (e.g., "Mathematics", "History"). Key attributes: `id` (string), `workspaceId` (string), `name` (string), `createdAt` (timestamp). A subject belongs to exactly one workspace.
- **User** *(amended from Phase 1)*: Now includes both Google-authenticated and email/password-authenticated identities. Key attributes remain: `uid`, `displayName`, `email`, `photoURL`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user can create a new workspace and see it reflected in the Sidebar switcher in under 5 seconds from clicking the "Create" action.
- **SC-002**: All four dashboard charts render with visible data within 2 seconds of the dashboard loading (using mock data).
- **SC-003**: The "Add Lecture" dialog opens within 200 ms of clicking the button, on both desktop and mobile.
- **SC-004**: The Sidebar correctly collapses/expands on mobile (Sheet opens and closes) with no layout shift on the main content area.
- **SC-005**: 100% of navigation links in the Sidebar correctly highlight the active route.
- **SC-006**: A user can sign up with a new email/password account and be redirected to the dashboard in under 15 seconds.
- **SC-007**: The dashboard layout (Sidebar + main content) renders without horizontal overflow on viewports from 375 px (mobile) to 1920 px (desktop).

---

## Assumptions

- The Firestore security rules will be addressed in a dedicated security phase; for now, rules should at minimum restrict workspace reads/writes to the authenticated owner.
- Subject creation/editing UI is out of scope for this phase; the Subject entity is defined in the data model for use in Phase 3.
- The Sidebar navigation links to "Subjects" and "Settings" are placeholder links — the destination pages are not built in this phase. They may render a simple "Coming soon" placeholder.
- `recharts` is already included as a dependency of the shadcn/ui `Chart` component — no separate npm install is required.
- The "Add Lecture" dialog in this phase is purely presentational. The ingestion pipeline and JSON validation are Phase 3 concerns.
- The user's currently selected workspace will be stored in React state (or a lightweight store) for this phase; Firestore-based workspace membership and multi-user collaboration are out of scope.
