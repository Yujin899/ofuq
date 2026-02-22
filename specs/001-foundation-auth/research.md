# Research: Phase 1 — Foundation & Authentication

**Feature**: `001-foundation-auth`
**Date**: 2026-02-22

## R-001: Next.js App Router Project Initialisation

**Decision**: Use `npx create-next-app@latest` with TypeScript, Tailwind CSS,
App Router, and `src/` directory structure enabled.

**Rationale**: This is the official Next.js project scaffolding tool and
produces a constitution-compliant baseline in one command. The `src/`
directory keeps source separate from config files.

**Alternatives considered**:
- Manual setup — too error-prone, slower, no benefit.
- Vite — prohibited by constitution (Principle I).

## R-002: shadcn/ui Initialisation

**Decision**: Use `npx shadcn@latest init` after Next.js scaffold, then
add individual components via `npx shadcn@latest add <component>`.

**Rationale**: The CLI handles Tailwind config, CSS variable setup, and
`cn()` utility in one step. Component-by-component install keeps bundle
size minimal.

**Alternatives considered**:
- Manual copy-paste from shadcn docs — fragile, misses config updates.

## R-003: Firebase Auth — Client-Side Only

**Decision**: Use `firebase` client SDK with `signInWithPopup` and
`GoogleAuthProvider`. No `firebase-admin` in this phase.

**Rationale**: Phase 1 has no server-side operations. Client SDK handles
Google OAuth popup and session persistence (`browserLocalPersistence`)
natively. `firebase-admin` is only needed when writing Firestore rules
or server-side operations (future phases).

**Alternatives considered**:
- `signInWithRedirect` — less predictable UX, harder to handle errors
  inline. Popup is more immediate for users.
- NextAuth.js — prohibited by constitution (must use Firebase Auth).

## R-004: Auth State Management Pattern

**Decision**: React Context (`AuthContext`) with a custom `useAuth` hook.
`onAuthStateChanged` listener in the provider sets `user`, `loading`,
and `error` state.

**Rationale**: This is the standard Firebase + React pattern. It avoids
external state libraries, is easy to test, and satisfies the
constitution's modularity principle.

**Alternatives considered**:
- Zustand — adding a state library for only auth state is over-engineering.
- Redux — overkill, constitution favours lightweight state.

## R-005: Route Protection Strategy

**Decision**: Client-side route guard using the `useAuth` hook inside a
`ProtectedRoute` wrapper component. While `loading` is true, show a
skeleton. Once resolved, redirect unauthenticated users to `/login`.

**Rationale**: Server-side middleware would require session cookies and
Firebase Admin SDK (out of scope for Phase 1). Client-side guards are
simple, reliable, and match the SPA-like UX the spec requires.

**Alternatives considered**:
- Next.js middleware — needs firebase-admin for token verification;
  deferred to future phases when server-side logic is introduced.

## R-006: Theme Provider Integration

**Decision**: `next-themes` `ThemeProvider` with `attribute="class"`,
`defaultTheme="dark"`, and `enableSystem={false}`.

**Rationale**: `attribute="class"` is required for Tailwind's `dark:`
variant to work. `enableSystem={false}` ensures dark mode is the
explicit default per constitution, not the OS setting.

**Alternatives considered**:
- `enableSystem={true}` with `defaultTheme="dark"` — would override
  user's OS preference on first visit, which is the spec's intent,
  but `enableSystem={false}` is more deterministic.

## R-007: Toast for Error Handling

**Decision**: Install shadcn `Toast` (via Sonner) component to display
auth errors inline. This adds `sonner` as a dependency.

**Rationale**: The spec requires "clear, friendly error messages" for
OAuth failures. A toast is the standard non-blocking notification
pattern. `shadcn/ui` uses `sonner` for its toast implementation.

**Alternatives considered**:
- Inline error text on login page — less polished, doesn't match
  Notion-like aesthetic.
- Alert dialog — too intrusive for transient errors.
