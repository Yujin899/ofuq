# Data Model: Phase 1 — Foundation & Authentication

**Feature**: `001-foundation-auth`
**Date**: 2026-02-22

## Entities

### User (Client-Side Only)

In Phase 1, no Firestore documents are created. The User entity exists
solely as a TypeScript interface derived from the Firebase Auth `User`
object. It is used to type the auth context and UI display.

```typescript
// types/auth.ts

interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}
```

### Relationships

None in this phase. The `AuthUser` is a standalone entity derived from
the Firebase Auth session.

### Validation Rules

- `uid` — always present when user is authenticated (guaranteed by Firebase).
- `displayName` — may be `null` for Google accounts without a display name;
  UI MUST fall back to the first letter of `email`.
- `email` — may be `null` in rare cases; UI MUST handle gracefully.
- `photoURL` — may be `null`; UI MUST show a fallback avatar (initials).

### State Transitions

```
[Not Authenticated] --sign in with Google--> [Authenticated]
[Authenticated]     --sign out--> [Not Authenticated]
[Authenticated]     --session expired--> [Not Authenticated]
[Page Loading]      --auth state resolved--> [Authenticated | Not Authenticated]
```

## Firestore Collections

None in this phase. Firestore is not used until Phase 2 (Workspaces).
