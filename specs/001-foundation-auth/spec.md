# Feature Specification: Phase 1 — Foundation & Authentication

> **⚠️ RETROACTIVE AMENDMENTS APPLIED**: This spec was updated on 2026-02-22 to reflect architectural decisions made in Phase 2. Changes are marked inline. See `002-workspaces-dashboard/spec.md` for full amendment rationale.

**Feature Branch**: `001-foundation-auth`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Phase 1 - Foundation & Authentication for the Ofuq e-learning workspace"

## User Scenarios & Testing

### User Story 1 — First-Time Sign In (Priority: P1)

A new visitor opens the Ofuq application for the first time. They land on a
clean, dark-themed login page with a single "Sign in with Google" button and
the Ofuq branding. After clicking the button, they authenticate via their
Google account and are immediately redirected to an empty dashboard page that
will serve as the hub for future phases.

**Why this priority**: Authentication is the gateway to every other feature.
Nothing can be built or tested without a working sign-in flow.

**Independent Test**: Fully testable by opening the app URL, clicking
"Sign in with Google", completing the OAuth flow, and verifying arrival on
the dashboard.

**Acceptance Scenarios**:

1. **Given** the user is not authenticated, **When** they navigate to any
   route, **Then** they are redirected to `/login`.
2. **Given** the user is on `/login`, **When** they click "Sign in with
   Google", **Then** the Google OAuth popup opens, they authenticate, and
   are redirected to `/`.
3. **Given** the user has just signed in, **When** the dashboard loads,
   **Then** their Google profile avatar and display name are visible in the
   top-right area of the page.

---

### User Story 2 — Returning User Session (Priority: P1)

A user who has previously signed in returns to the application. Their
session persists via Firebase Auth, so they bypass the login page entirely
and land directly on the dashboard.

**Why this priority**: Session persistence is essential to avoid forcing
users to re-authenticate on every visit, which would make the app unusable.

**Independent Test**: Sign in once, close the browser tab, reopen the app
URL, and verify that the dashboard loads without being asked to log in again.

**Acceptance Scenarios**:

1. **Given** the user has an active session, **When** they navigate
   to `/login`, **Then** they are automatically redirected to `/`.
2. **Given** the user has an active session, **When** they navigate
   to `/`, **Then** the dashboard loads immediately with their profile
   information.

---

### User Story 3 — Sign Out (Priority: P2)

An authenticated user wants to sign out. They click their avatar in the
top-right corner, a dropdown appears with a "Sign out" option. Clicking it
ends the session and returns them to the login page.

**Why this priority**: Sign-out is a basic account management function
needed for multi-user scenarios and privacy, but it is secondary to the
sign-in flow itself.

**Independent Test**: While signed in, click the avatar dropdown, click
"Sign out", and verify redirection to `/login` and that refreshing the
page does not restore the session.

**Acceptance Scenarios**:

1. **Given** the user is signed in, **When** they click their avatar,
   **Then** a dropdown menu appears with at least their name/email and a
   "Sign out" option.
2. **Given** the dropdown is open, **When** the user clicks "Sign out",
   **Then** the session is destroyed and the user is redirected to `/login`.
3. **Given** the user has signed out, **When** they attempt to navigate to
   `/`, **Then** they are redirected to `/login`.

---

### User Story 4 — Dark/Light Theme Toggle (Priority: P2)

A user on the dashboard wants to switch between dark and light themes.
They find a toggle control in the header area. Clicking it switches the
theme instantly. The application defaults to dark mode on first visit and
remembers the user's preference on subsequent visits.

**Why this priority**: Theming is a foundational UI concern that must be
established in Phase 1 so all future components inherit the correct tokens.
However, it is secondary to core authentication.

**Independent Test**: Open the app, verify it starts in dark mode, toggle
to light mode, refresh the page, and verify light mode is preserved.

**Acceptance Scenarios**:

1. **Given** a first-time user visits the application, **When** the page
   loads, **Then** the application renders in dark mode.
2. **Given** the user is on the dashboard, **When** they click the theme
   toggle, **Then** the interface switches between dark and light mode
   instantly without a page reload.
3. **Given** the user has switched to light mode, **When** they close and
   reopen the app, **Then** light mode is preserved.

---

### Edge Cases

- What happens if Google OAuth fails (e.g., popup blocked, network error)?
  The user MUST see a clear, friendly error message on the login page.
- What happens if the session token expires mid-use? The app MUST detect
  the expired session and redirect to `/login` without crashing.
- What happens if the user navigates to a non-existent route? The app MUST
  show a proper 404 page or redirect to `/`.
- What happens if the user has cookies/JS disabled? The login page MUST
  still render and display a message if sign-in is not possible.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST be initialised as a Next.js project
  using the App Router with TypeScript strict mode enabled. The HTML root
  element MUST have `lang="en"` and the application MUST render exclusively
  in English. *(Amended Phase 2-A)*
- **FR-002**: Tailwind CSS MUST be configured as the sole styling solution
  with CSS variables in `hsl(var(--<token>))` format for all colour tokens.
- **FR-003**: `shadcn/ui` MUST be initialised and the following components
  MUST be installed: **Button**, **Card**, **Avatar**, **DropdownMenu**,
  **Separator**, **Skeleton** (for loading states).
- **FR-004**: `next-themes` MUST be integrated via a `ThemeProvider`
  wrapping the application in the root layout. Dark mode MUST be the
  default theme.
- **FR-005**: Firebase Authentication MUST be configured with **two**
  sign-in providers: Google Sign-In (OAuth) and Email/Password (sign-up and
  sign-in). *(Amended Phase 2-B — was: Google only)*
- **FR-006**: A custom React context or hook (e.g., `AuthProvider` /
  `useAuth`) MUST expose the current user state (`user`, `loading`,
  `error`) globally across the application.
- **FR-007**: The `/login` route MUST be a public page displaying the Ofuq
  branding, an email/password form with Sign In/Sign Up toggle, and a
  "Continue with Google" button separated by a visual divider. Required
  shadcn/ui additions: **Input**, **Label**, **Form**. *(Amended Phase 2-B)*
- **FR-008**: The `/` route MUST be a protected page (the Dashboard) that
  renders only for authenticated users. In this phase it serves as an
  empty placeholder with a welcome message and the user's profile
  information.
- **FR-009**: Route protection logic MUST redirect unauthenticated users
  to `/login` and redirect authenticated users from `/login` to `/`.
- **FR-010**: The dashboard navigation MUST be a persistent Sidebar
  (not a top header). On desktop it is always visible; on mobile it uses the
  shadcn/ui **Sheet** component for overlay. The Sidebar contains the user
  avatar (with sign-out dropdown), workspace switcher, theme toggle, and
  navigation links. *(Amended Phase 2-C — was: top header)*
- **FR-011**: The sign-out action MUST clear the session and redirect the
  user to `/login`.
- **FR-012**: The root layout (`RootLayout`) MUST wrap the entire
  application with the `ThemeProvider` and `AuthProvider`.
- **FR-013**: A loading/skeleton state MUST be shown while the
  authentication system resolves the initial user state, preventing a
  flash of unauthenticated content.

### Key Entities

- **User**: Represents an authenticated individual. Key attributes:
  `uid`, `displayName`, `email`, `photoURL`, `lastLoginAt`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new user can complete the full sign-in flow (land on
  `/login` → click "Sign in with Google" → arrive on `/`) in under
  10 seconds (excluding Google's OAuth screen time).
- **SC-002**: A returning user with an active session loads the dashboard
  within 3 seconds without seeing the login page.
- **SC-003**: Theme toggle switches the entire UI between dark and light
  modes in under 200ms with no visible flash of unstyled content.
- **SC-004**: 100% of unauthenticated navigation attempts to protected
  routes result in redirection to `/login`.
- **SC-005**: The application renders correctly on viewports from 375px
  (mobile) to 1920px (desktop) width.
- **SC-006**: All interactive elements (buttons, dropdowns, toggles) are
  keyboard-navigable and have appropriate ARIA labels.

### Assumptions

- Firebase project credentials (API key, project ID, auth domain) will be
  provided by the user or are already configured.
- The Google OAuth consent screen has been set up in the Firebase console.
- No additional sign-in providers beyond Google and Email/Password are
  required in this phase. *(Updated Phase 2-B)*
- The dashboard in this phase is intentionally empty — it will be populated
  with Workspaces and Charts in Phase 2.
- No Firestore data is written or read in this phase; Firebase is used
  solely for authentication.
- Navigation will be migrated to a Sidebar in Phase 2 (Amendment C);
  the top-header implementation is considered temporary.
