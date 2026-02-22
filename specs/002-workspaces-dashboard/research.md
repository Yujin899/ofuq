# Phase 0 Research: Phase 2 — Workspaces & Dashboard

**Branch**: `002-workspaces-dashboard` | **Date**: 2026-02-22

---

## Decision 1 — Email / Password Auth Integration Pattern

**Decision**: Use Firebase `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` directly (no third-party auth wrappers). Integrate with `react-hook-form` + `zod` (already a shadcn/ui `Form` dependency) for field-level validation before calling Firebase.

**Rationale**: `react-hook-form` + `zod` are pulled in automatically by `npx shadcn@latest add form`. This avoids an extra install and keeps validation co-located with the form component. Firebase error codes (`auth/wrong-password`, `auth/email-already-in-use`, `auth/weak-password`) map cleanly to field-level `setError` calls.

**Alternative considered**: Formik — rejected because shadcn/ui Form officially uses react-hook-form and diverging would violate the constitution.

---

## Decision 2 — Sidebar Architecture (Layout Route Group)

**Decision**: Use a Next.js App Router **route group** `(protected)` with a nested `layout.tsx` that renders `<AppShell>`. The `AppShell` contains the persistent `<Sidebar>` alongside `<main>{children}</main>`. This layout only wraps protected routes, keeping `/login` and `/` (redirect) outside the shell.

**Rationale**: Route groups allow per-group layouts without affecting URL segments. The Sidebar is rendered once at the group-layout level, not re-instantiated per page, avoiding flash during navigation.

**Alternative considered**: Putting the Sidebar in the root layout — rejected because `/login` must be Sidebar-free.

**File structure**:
```
src/app/
  (protected)/
    layout.tsx       ← AppShell: Sidebar + main
    page.tsx         ← Dashboard (moved here)
    subjects/page.tsx    ← placeholder
    settings/page.tsx    ← placeholder
  (auth)/
    login/page.tsx       ← unchanged
  layout.tsx             ← root: ThemeProvider + AuthProvider + Toaster only
  not-found.tsx
```

---

## Decision 3 — Workspace State Management

**Decision**: Use a React Context (`WorkspaceProvider` + `useWorkspace` hook). The context stores `workspaces: Workspace[]`, `activeWorkspace: Workspace | null`, and a `setActiveWorkspace` function. Firestore subscription via `onSnapshot` on the user's workspaces collection is the live data source.

**Rationale**: Lightweight. No additional store library needed. `onSnapshot` provides real-time sync — if a workspace is renamed in another tab/device, the UI updates automatically.

**Alternative considered**: Zustand — rejected to avoid adding a library outside the constitution's approved table.

---

## Decision 4 — Firestore Collection Structure

**Decision**: Use a **flat collection** model with owner-scoped queries rather than a nested subcollection:

```
/workspaces/{workspaceId}      ← top-level collection; query by ownerId
/subjects/{subjectId}          ← top-level collection; query by workspaceId
```

**Rationale**: Flat collections are easier to query and support future cross-workspace reports. Subcollections require knowing the parent path, which complicates cross-workspace Subject queries in Phase 3+. Firestore security rules can enforce ownership via `request.auth.uid == resource.data.ownerId`.

**Alternative considered**: `/users/{uid}/workspaces/{workspaceId}/subjects/{subjectId}` nested subcollection — rejected for query inflexibility.

---

## Decision 5 — shadcn/ui Chart Installation

**Decision**: The `shadcn/ui` Chart component wraps `recharts`. Install via:

```bash
npx shadcn@latest add chart
```

This installs `recharts` as an npm dependency and adds `src/components/ui/chart.tsx` (the `ChartContainer`, `ChartTooltip`, `ChartLegend` wrappers). No separate `npm install recharts` is needed.

**Rationale**: Using the shadcn chart wrapper ensures theme tokens (`--chart-1` through `--chart-5` already in `globals.css`) are applied consistently in both dark and light mode.

---

## Decision 6 — Workspace Creation UX

**Decision**: Workspace creation uses a **Dialog + Input** pattern triggered from:
1. The empty-state card on the dashboard (first visit).
2. A "+ New Workspace" item at the bottom of the workspace switcher dropdown.

The `createWorkspace` function calls `addDoc` on Firestore `/workspaces` and immediately selects the new workspace.

**Rationale**: Dialog pattern is already approved (used for Add Lecture). Reusing the same paradigm for workspace creation keeps the UX consistent.

---

## Decision 7 — Mock Data Shape for Charts

**Decision**: `src/lib/mock-data.ts` exports four named typed arrays:

- `studyMinutesData`: `{ date: string; minutes: number }[]` — for Area Chart
- `timePerSubjectData`: `{ subject: string; minutes: number; fill: string }[]` — for Donut PieChart
- `quizScoresData`: `{ subject: string; score: number }[]` — for BarChart
- `dailyGoalData`: `{ name: string; value: number; fill: string }[]` — for RadialBarChart

**Rationale**: Explicit types prevent `any`. Named exports allow tree-shaking when real data is wired in Phase 3.
