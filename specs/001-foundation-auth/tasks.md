# Tasks: Phase 1 — Foundation & Authentication

**Input**: Design documents from `specs/001-foundation-auth/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), quickstart.md (✅)

**Tests**: No automated tests requested for this phase. Verification is manual (see Phase 5).

## ⚠️ FLASH DIRECTIVES (READ BEFORE ANY TASK)

> These guardrails are **NON-NEGOTIABLE**. Violating any of them is a blocking error.

1. **DO NOT** implement any Firestore database logic. Firebase = Auth only.
2. **DO NOT** invent custom UI components. Use only Tailwind + shadcn/ui.
3. **DO NOT** install libraries outside the constitution's Mandatory Libraries table.
4. **Ensure** `defaultTheme="dark"` and `enableSystem={false}` in ThemeProvider.
5. **ALL** colours MUST use CSS variable tokens: `hsl(var(--token))`. No hardcoded values.
6. **ALL** TypeScript files MUST have explicit type annotations. No `any`.
7. On Google sign-in failure → `toast.error("Failed to sign in. Please try again.")`.
8. On session expiry → `onAuthStateChanged` sets user to `null` → redirect to `/login`.
9. **DO NOT** use `"use server"` or Server Actions. All auth logic is client-side.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US4 from spec.md)
- Exact file paths included in every task

---

## Phase 1: Setup (Project Scaffold)

**Purpose**: Initialize Next.js project, install UI framework and dependencies

- [x] T001 Create Next.js project by running `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm` from repo root
- [x] T002 Verify TypeScript strict mode is enabled in `tsconfig.json` (`"strict": true`) — enable if missing
- [x] T003 Initialize shadcn/ui by running `npx -y shadcn@latest init -d` from repo root
- [x] T004 Install required shadcn components by running `npx shadcn@latest add button card avatar dropdown-menu separator skeleton sonner`
- [x] T005 Install remaining dependencies by running `npm install firebase next-themes framer-motion`

**Checkpoint**: `npm run dev` starts without errors. `src/components/ui/` contains all 7 component files. `firebase`, `next-themes`, `framer-motion` appear in `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story page can be built

**⚠️ CRITICAL**: No user story work (Phase 3+) can begin until this phase is complete

- [x] T006 [P] Create auth type definitions in `src/types/auth.ts` — define `AuthUser`, `AuthState`, `AuthContextType` interfaces per plan.md T006
- [x] T007 [P] Create Firebase configuration in `src/lib/firebase.ts` — init app + export `auth` only (NO Firestore imports)
- [x] T008 [P] Create `.env.example` with 6 `NEXT_PUBLIC_FIREBASE_*` keys (empty values) and `.env.local` (same keys, gitignored). Verify `.gitignore` includes `.env.local`
- [x] T009 [P] Create ThemeProvider wrapper in `src/components/providers/theme-provider.tsx` — `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`
- [x] T010 Create AuthProvider context in `src/components/providers/auth-provider.tsx` — `onAuthStateChanged` listener, `signInWithPopup`, `signOut`, maps Firebase User → AuthUser (depends on T006, T007)
- [x] T011 Create `useAuth` convenience hook in `src/hooks/use-auth.ts` — consumes `AuthContext`, throws if used outside provider (depends on T010)
- [x] T012 Update root layout in `src/app/layout.tsx` — wrap app with ThemeProvider → AuthProvider → Toaster, add Inter font, set metadata to "Ofuq — أفق" (depends on T009, T010)

**Checkpoint**: Foundation ready — all providers, hooks, and config files in place. `npm run dev` still builds cleanly.

---

## Phase 3: User Story 1 + 2 — Sign In & Session Persistence (Priority: P1) 🎯 MVP

**Goal**: A new user can sign in with Google and land on a protected dashboard. A returning user bypasses login entirely via session persistence.

**Independent Test**: Open app → redirected to `/login` → sign in with Google → arrive at `/` with avatar + name → close tab → reopen → dashboard loads directly

### Implementation for US1 + US2

- [x] T013 [P] [US1] Create ProtectedRoute component in `src/components/auth/protected-route.tsx` — show Skeleton while loading, redirect to `/login` if unauthenticated
- [x] T014 [P] [US3+US4] Create UserNav component in `src/components/layout/user-nav.tsx` — Avatar with initials fallback, DropdownMenu with name/email label, theme toggle (Sun/Moon icons), and Sign out action
- [x] T015 [US1] Create login page in `src/app/(auth)/login/page.tsx` — Card with "أفق" branding, "Sign in with Google" button with Google SVG icon, `toast.error(...)` on failure, redirect to `/` if already authenticated (depends on T011)
- [x] T016 [US1+US2] Create dashboard page by replacing `src/app/page.tsx` — wrap with ProtectedRoute, header with "أفق" title + UserNav, placeholder welcome message with user's displayName (depends on T013, T014)

**Checkpoint**: Full sign-in flow works. Session persists across tab closes. Unauthenticated users are redirected to `/login`. Authenticated users on `/login` are redirected to `/`.

---

## Phase 4: User Story 3 + 4 — Sign Out & Theme Toggle (Priority: P2)

**Goal**: User can sign out via the avatar dropdown and toggle between dark/light themes with persistence.

**Independent Test**: Click avatar → "Sign out" → redirected to `/login` → session cleared. Toggle theme → refresh → preference preserved.

> **NOTE**: US3 and US4 are already implemented within T014 (UserNav) and T009 (ThemeProvider). This phase exists solely for **verification** — no new code tasks.

**Checkpoint**: Sign-out clears session and redirects. Theme toggle switches instantly. Dark mode is the default on first visit. Theme preference survives page refresh.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Error pages, visual verification, and production build validation

- [x] T017 [P] Create 404 page in `src/app/not-found.tsx` — "Page not found" message with Button linking back to `/`
- [x] T018 [P] Verify CSS variable tokens in `src/app/globals.css` — confirm `:root` (light) and `.dark` selectors both exist with `hsl` colour tokens
- [x] T019 Verify dark mode default — clear localStorage, open `/login`, confirm dark mode renders on first visit. Toggle to light, refresh, confirm persistence
- [x] T020 Run production build via `npm run build` — MUST exit with zero errors (missing `.env.local` warnings are acceptable)

**Checkpoint**: All pages render correctly. Build passes. Dark mode is default. 404 page works.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1+US2 (Phase 3)**: Depends on Phase 2 completion
- **US3+US4 (Phase 4)**: Verification only — depends on Phase 3 completion
- **Polish (Phase 5)**: Depends on Phase 3 completion

### Within Phase 2 (Foundational)

```
T006 ──┐
T007 ──┤
T008 ──┤── All [P] tasks can run in parallel
T009 ──┘
T010 ────── depends on T006 + T007
T011 ────── depends on T010
T012 ────── depends on T009 + T010
```

### Within Phase 3 (US1+US2)

```
T013 ──┐── can run in parallel
T014 ──┘
T015 ────── depends on T011 (useAuth hook)
T016 ────── depends on T013 + T014
```

### Within Phase 5 (Polish)

```
T017 ──┐── can run in parallel
T018 ──┘
T019 ────── manual verification (sequential)
T020 ────── final build check (last task)
```

### Parallel Opportunities

```bash
# Phase 2 — launch these 4 together:
T006: "Create auth types in src/types/auth.ts"
T007: "Create Firebase config in src/lib/firebase.ts"
T008: "Create .env.example and .env.local"
T009: "Create ThemeProvider in src/components/providers/theme-provider.tsx"

# Phase 3 — launch these 2 together:
T013: "Create ProtectedRoute in src/components/auth/protected-route.tsx"
T014: "Create UserNav in src/components/layout/user-nav.tsx"

# Phase 5 — launch these 2 together:
T017: "Create 404 page in src/app/not-found.tsx"
T018: "Verify CSS tokens in src/app/globals.css"
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T012)
3. Complete Phase 3: US1+US2 (T013–T016)
4. **STOP and VALIDATE**: Test sign-in, session, and route protection manually
5. If working → proceed to Phase 4 (verification) and Phase 5 (polish)

### Sequential Execution Order (for single agent)

```
T001 → T002 → T003 → T004 → T005          Setup
  → T006 + T007 + T008 + T009 (parallel)   Foundational (batch 1)
  → T010 → T011 → T012                     Foundational (batch 2)
  → T013 + T014 (parallel)                 Pages (batch 1)
  → T015 → T016                            Pages (batch 2)
  → T017 + T018 (parallel)                 Polish (batch 1)
  → T019 → T020                            Polish (batch 2)
```

---

## Verification Matrix

After all tasks are complete and Firebase credentials are configured in `.env.local`:

| # | Covers | Test | Expected |
|---|--------|------|----------|
| 1 | US1 | Cold start → open `/` | Redirect to `/login` in dark mode |
| 2 | US1 | Click "Sign in with Google" → complete OAuth | Redirect to `/`, avatar + name visible |
| 3 | US1 | Block popup or cancel OAuth | Toast: "Failed to sign in. Please try again." |
| 4 | US2 | Sign in → close tab → reopen `/` | Dashboard loads directly |
| 5 | US3 | Click avatar → "Sign out" | Redirect to `/login`, session cleared |
| 6 | US3 | After sign out → navigate to `/` | Redirect to `/login` |
| 7 | US1 | While signed in → navigate to `/login` | Redirect to `/` |
| 8 | US4 | Click theme toggle | Instant dark ↔ light switch |
| 9 | US4 | Toggle to light → refresh | Light mode preserved |
| 10 | — | Navigate to `/nonexistent` | Shows 404 page with "Go to Dashboard" link |
| 11 | — | Resize to 375px width | All elements remain usable |
| 12 | — | Tab through login page | All buttons focusable + activatable |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps tasks to specific user stories for traceability
- US3 (Sign Out) and US4 (Theme Toggle) have no dedicated code tasks — they are implemented within T014 (UserNav) and verified in Phase 4
- Each user story is independently testable after its phase checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
