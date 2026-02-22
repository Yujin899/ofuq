# Implementation Plan: Phase 2 — Workspaces & Dashboard

**Branch**: `002-workspaces-dashboard`
**Spec**: [`spec.md`](file:///d:/PROGRAMMING/WEB/ofuq/specs/002-workspaces-dashboard/spec.md)
**Research**: [`research.md`](file:///d:/PROGRAMMING/WEB/ofuq/specs/002-workspaces-dashboard/research.md)
**Data Model**: [`data-model.md`](file:///d:/PROGRAMMING/WEB/ofuq/specs/002-workspaces-dashboard/data-model.md)
**Created**: 2026-02-22

---

## ⚠️ FLASH DIRECTIVES (NON-NEGOTIABLE GUARDRAILS)

1. **Phase 1 refactoring FIRST** — T001-T007 are regressions/amendments to Phase 1 code. They MUST be completed and verified before any Phase 2 code begins (T008+).
2. **No custom UI primitives** — If a `shadcn/ui` component exists, use it. Zero exceptions.
3. **Mock data only for charts** — ALL chart components MUST import from `src/lib/mock-data.ts`. NO Firestore calls for charts in this phase.
4. **No JSON logic in Add Lecture** — The Add Lecture dialog is UI-only. No parsing, validation, or Firestore writes for lecture content.
5. **Explicit TypeScript** — No `any`. All Firestore document shapes must use the interfaces in `src/types/`.
6. **HSL colour tokens** — All colours via `hsl(var(--token))`. No hardcoded hex, RGB, or non-token values.
7. **lang="en"** — The root `<html>` element must have `lang="en"`.
8. **Route group layout** — The Sidebar lives in `src/app/(protected)/layout.tsx` only. It must NOT appear in the root layout or on `/login`.

---

## Constitution Check ✅

| Principle | Status | Notes |
|---|---|---|
| Next.js App Router | ✅ | Route group `(protected)` used for layout |
| Tailwind CSS only | ✅ | No CSS-in-JS or raw CSS |
| shadcn/ui for all primitives | ✅ | Sheet, Dialog, Textarea, Form, Input, Label, Chart |
| framer-motion for animations | ✅ | Sidebar open/close transition |
| Firebase Auth + Firestore | ✅ | Email/password + Google added; Workspace + Subject in Firestore |
| next-themes dark default | ✅ | Unchanged from Phase 1 |
| recharts via shadcn chart | ✅ | `npx shadcn@latest add chart` |
| TypeScript strict | ✅ | Explicit interfaces for all entities |
| Notion-like minimal UI | ✅ | Sidebar uses muted-foreground, accent highlight only |
| No Firestore for charts | ✅ | Mock data only |

---

## Project File Structure After Phase 2

```
src/
  app/
    (auth)/
      login/page.tsx          ← AMENDED: email+password + Google
    (protected)/
      layout.tsx              ← NEW: AppShell (Sidebar + main)
      page.tsx                ← MOVED: Dashboard with charts
      subjects/page.tsx       ← NEW: placeholder
      settings/page.tsx       ← NEW: placeholder
    layout.tsx                ← AMENDED: lang="en", providers only
    not-found.tsx
  components/
    auth/
      protected-route.tsx     ← unchanged
    layout/
      app-shell.tsx           ← NEW
      sidebar.tsx             ← NEW
      workspace-switcher.tsx  ← NEW
    dashboard/
      study-minutes-chart.tsx ← NEW
      time-per-subject-chart.tsx ← NEW
      quiz-scores-chart.tsx   ← NEW
      daily-goal-chart.tsx    ← NEW
    lectures/
      add-lecture-dialog.tsx  ← NEW
    providers/
      auth-provider.tsx       ← AMENDED: email/password methods
      theme-provider.tsx      ← unchanged
      workspace-provider.tsx  ← NEW
    ui/                       ← shadcn components
  hooks/
    use-auth.ts               ← unchanged
    use-workspace.ts          ← NEW
  lib/
    firebase.ts               ← AMENDED: add Firestore export
    mock-data.ts              ← NEW
  types/
    auth.ts                   ← unchanged
    workspace.ts              ← NEW
    subject.ts                ← NEW
```

---

## Implementation Tasks (Sequential & Atomic)

### Phase A: Phase 1 Refactoring (Amendments A, B, C)

**Purpose**: Apply all three retroactive amendments before any Phase 2 code.

---

#### T001 — [Amendment A] Set `lang="en"` on Root Layout

**Files**: `src/app/layout.tsx`
**Depends on**: none

```tsx
// Change:
<html lang="en" suppressHydrationWarning>
// Verify: lang="en" is present (it may already be — confirm and mark done)
```

**Guardrail check**: No Arabic text in RootLayout. Remove any Arabic from `<title>` or `<meta>` if present. Update metadata:
```tsx
export const metadata: Metadata = {
  title: "Ofuq",
  description: "Your e-learning workspace",
};
```

---

#### T002 — [Amendment B] Install shadcn Form, Input, Label components

**CLI command** (run from repo root):
```bash
npx shadcn@latest add form input label
```

**Expected output**: Creates `src/components/ui/form.tsx`, `input.tsx`, `label.tsx` and installs `react-hook-form`, `@hookform/resolvers`, `zod`.

**Verify**: `package.json` contains `react-hook-form` and `zod`.

---

#### T003 — [Amendment B] Expand AuthProvider with Email/Password methods

**Files**: `src/components/providers/auth-provider.tsx`, `src/types/auth.ts`

Add to `AuthContextType`:
```typescript
// src/types/auth.ts
signUpWithEmail: (email: string, password: string) => Promise<void>;
signInWithEmail: (email: string, password: string) => Promise<void>;
```

Implement in `AuthProvider`:
```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

const signUpWithEmail = useCallback(async (email: string, password: string) => {
  try {
    setError(null);
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    setError(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}, []);

const signInWithEmail = useCallback(async (email: string, password: string) => {
  try {
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    setError(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}, []);
```

Expose both in context value. **GUARDRAIL**: NO server actions. Auth is client-side only.

---

#### T004 — [Amendment B] Rebuild Login Page with Email/Password + Google

**File**: `src/app/(auth)/login/page.tsx`

**UI structure** (all shadcn components):
- `Card` container with `CardHeader` ("Sign in to Ofuq") and `CardContent`
- **Email/Password Form** using `Form`, `FormField`, `Input`, `Label` from shadcn
- `zod` schema: `z.object({ email: z.string().email(), password: z.string().min(6) })`
- A toggle state `mode: "signin" | "signup"` — toggles button label and which Firebase method is called
- **Divider**: `<div>` with `Separator` and "or" text, styled with `text-muted-foreground`
- **Google button**: existing `signInWithGoogle` call, same SVG icon

**Error mapping** (Firebase error codes → `form.setError` or `toast.error`):
```
auth/wrong-password       → form.setError("password", { message: "Incorrect password." })
auth/user-not-found       → form.setError("email",    { message: "No account with this email." })
auth/email-already-in-use → form.setError("email",    { message: "Email already registered. Sign in instead." })
auth/weak-password        → form.setError("password", { message: "Password must be at least 6 characters." })
```

**GUARDRAIL**: No browser `alert()`. All errors surfaced via `form.setError` (inline) or `toast.error` (Sonner) for uncategorised failures.

---

#### T005 — [Amendment C] Install Sheet component

**CLI command**:
```bash
npx shadcn@latest add sheet
```

**Expected output**: Creates `src/components/ui/sheet.tsx`.

---

#### T006 — [Amendment C] Remove Phase 1 Header, create AppShell layout

**Files to create**: `src/app/(protected)/layout.tsx`, `src/components/layout/app-shell.tsx`

`app-shell.tsx`:
```tsx
"use client";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r">
        <Sidebar />
      </aside>

      {/* Mobile sidebar — Sheet */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex md:hidden items-center h-12 border-b px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

`(protected)/layout.tsx`:
```tsx
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { AppShell } from "@/components/layout/app-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
```

**Files to update**: `src/app/page.tsx` — move content to `src/app/(protected)/page.tsx` and simplify root `page.tsx` to a redirect (or remove entirely if `(protected)/page.tsx` covers `/`).

**GUARDRAIL**: Remove the `<header>` block from the old Phase 1 `page.tsx`. The AppShell handles ALL layout framing.

---

#### T007 — [Amendment C] Create Sidebar component

**File**: `src/components/layout/sidebar.tsx`

Structure:
```
<aside>
  [Top section]
    WorkspaceSwitcher          ← T013 component
  [Nav links]
    NavItem: Dashboard (/)
    NavItem: Subjects (/subjects)  ← placeholder, no page yet
    NavItem: Settings (/settings)  ← placeholder, no page yet
  [Bottom section]
    AddLectureButton           ← opens AddLectureDialog (T016)
    UserNavDropdown            ← Avatar + name + theme toggle + Sign Out
</aside>
```

Key implementation details:
- Use `usePathname()` from `next/navigation` to detect active route
- Active link: `bg-accent text-accent-foreground` classes
- Inactive link: `text-muted-foreground hover:bg-accent/50`
- No border on nav items — use padding and colour alone (Notion aesthetic)
- All colours via `hsl(var(--token))` — no hardcoded colours

Lucide icons to use: `LayoutDashboard`, `BookOpen`, `Settings`, `Plus`, `LogOut`, `Sun`, `Moon`

---

### Phase B: Firestore & State Setup

**Purpose**: Establish data layer before building UI that consumes it.

---

#### T008 — Add Firestore to Firebase config

**File**: `src/lib/firebase.ts`

```typescript
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
```

**GUARDRAIL**: Export only `app`, `auth`, and `db`. No other Firebase services.

---

#### T009 — Create TypeScript types for Workspace and Subject

**Files**: `src/types/workspace.ts`, `src/types/subject.ts`

Implement exactly as defined in `data-model.md`. No deviation.

---

#### T010 — Create WorkspaceProvider and useWorkspace hook

**Files**: `src/components/providers/workspace-provider.tsx`, `src/hooks/use-workspace.ts`

`WorkspaceProvider`:
- Subscribes to `onSnapshot` on `/workspaces` where `ownerId == auth.currentUser.uid`, ordered by `createdAt asc`
- Manages `workspaces: Workspace[]`, `activeWorkspace: Workspace | null`, `loading: boolean`, `error: Error | null`
- Auto-selects the first workspace when the list loads and `activeWorkspace` is null
- Exposes `createWorkspace(input)`: calls `addDoc(collection(db, "workspaces"), { ownerId, name, createdAt: serverTimestamp() })`, then sets the new workspace as active

`useWorkspace`:
```typescript
"use client";
import { useContext } from "react";
import { WorkspaceContext } from "@/components/providers/workspace-provider";

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
```

**GUARDRAIL**: Business logic (Firestore operations) in the provider/hook only. Page components call `useWorkspace()` — they do NOT import `db` directly.

---

### Phase C: Mock Data & Charts

**Purpose**: Build the dashboard chart layer using static data before Firestore wiring.

---

#### T011 — Create `src/lib/mock-data.ts`

**File**: `src/lib/mock-data.ts`

Full file content:
```typescript
import type {
  StudyMinuteDataPoint,
  TimePerSubjectDataPoint,
  QuizScoreDataPoint,
  DailyGoalDataPoint,
} from "@/types/mock-data";

export const studyMinutesData: StudyMinuteDataPoint[] = [
  { date: "2026-02-15", minutes: 45 },
  { date: "2026-02-16", minutes: 30 },
  { date: "2026-02-17", minutes: 90 },
  { date: "2026-02-18", minutes: 60 },
  { date: "2026-02-19", minutes: 75 },
  { date: "2026-02-20", minutes: 50 },
  { date: "2026-02-21", minutes: 110 },
];

export const timePerSubjectData: TimePerSubjectDataPoint[] = [
  { subject: "Mathematics", minutes: 240, fill: "var(--chart-1)" },
  { subject: "History",     minutes: 150, fill: "var(--chart-2)" },
  { subject: "Science",     minutes: 180, fill: "var(--chart-3)" },
  { subject: "Literature",  minutes: 90,  fill: "var(--chart-4)" },
];

export const quizScoresData: QuizScoreDataPoint[] = [
  { subject: "Mathematics", score: 82 },
  { subject: "History",     score: 74 },
  { subject: "Science",     score: 90 },
  { subject: "Literature",  score: 68 },
];

export const dailyGoalData: DailyGoalDataPoint[] = [
  { name: "Achieved", value: 72, fill: "var(--chart-1)" },
  { name: "Remaining", value: 28, fill: "var(--chart-5)" },
];
```

Also create `src/types/mock-data.ts` with the interfaces from `data-model.md`.

---

#### T012 — Install shadcn Chart component

**CLI command** (run from repo root):
```bash
npx shadcn@latest add chart
```

**Expected output**: Creates `src/components/ui/chart.tsx`. Installs `recharts` as npm dependency.

**Verify**: `recharts` appears in `package.json` dependencies.

---

#### T013 — Create WorkspaceSwitcher component

**File**: `src/components/layout/workspace-switcher.tsx`

Uses `useWorkspace()`. Renders a `DropdownMenu` showing:
- Current workspace name (trigger button)
- List of all `workspaces` as `DropdownMenuItem`s — clicking selects that workspace
- A `DropdownMenuSeparator` then a `DropdownMenuItem` with "New Workspace" that opens the Create Workspace Dialog

Create Workspace Dialog inside this component:
- `Dialog` with a single `Input` for workspace name
- On confirm: calls `createWorkspace({ name })`, closes dialog
- On error: shows `toast.error("Failed to create workspace. Please try again.")`
- Loading state: disable "Create" button while `createWorkspace` is pending

---

#### T014 — Create Dashboard chart components (4 files)

**Files**:
- `src/components/dashboard/study-minutes-chart.tsx`
- `src/components/dashboard/time-per-subject-chart.tsx`
- `src/components/dashboard/quiz-scores-chart.tsx`
- `src/components/dashboard/daily-goal-chart.tsx`

Each file:
- Is a `"use client"` component
- Imports data from `@/lib/mock-data` (NOT from Firestore)
- Wraps the chart in a `Card` (shadcn) with a `CardHeader` (title) and `CardContent` (chart)
- Uses `ChartContainer` from `@/components/ui/chart` to apply theme tokens
- **Must NOT** have any Firestore imports

**Study Minutes** — `AreaChart`:
```tsx
<AreaChart data={studyMinutesData}>
  <XAxis dataKey="date" />
  <YAxis />
  <ChartTooltip content={<ChartTooltipContent />} />
  <Area type="monotone" dataKey="minutes" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
</AreaChart>
```

**Time per Subject** — `PieChart` (Donut):
```tsx
<PieChart>
  <Pie data={timePerSubjectData} dataKey="minutes" nameKey="subject" innerRadius={60} outerRadius={90} />
  <ChartTooltip content={<ChartTooltipContent />} />
  <ChartLegend content={<ChartLegendContent />} />
</PieChart>
```

**Quiz Scores** — `BarChart`:
```tsx
<BarChart data={quizScoresData}>
  <XAxis dataKey="subject" />
  <YAxis domain={[0, 100]} />
  <ChartTooltip content={<ChartTooltipContent />} />
  <Bar dataKey="score" fill="var(--chart-2)" radius={[4,4,0,0]} />
</BarChart>
```

**Daily Goal** — `RadialBarChart`:
```tsx
<RadialBarChart data={dailyGoalData} innerRadius={60} outerRadius={90}>
  <RadialBar dataKey="value" />
  <ChartTooltip content={<ChartTooltipContent />} />
  <ChartLegend content={<ChartLegendContent />} />
</RadialBarChart>
```

---

#### T015 — Build Dashboard Page (protected route)

**File**: `src/app/(protected)/page.tsx`

Layout:
```tsx
export default function DashboardPage() {
  const { activeWorkspace, workspaces, loading } = useWorkspace();

  if (loading) return <DashboardSkeleton />;

  if (!loading && workspaces.length === 0) return <EmptyWorkspaceState />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        {activeWorkspace?.name ?? "Dashboard"}
      </h1>

      {/* Row 1 */}
      <StudyMinutesChart />

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TimePerSubjectChart />
        <QuizScoresChart />
        <DailyGoalChart />
      </div>
    </div>
  );
}
```

`EmptyWorkspaceState`: A `Card` with text "Create your first workspace to get started" and a `Button` that opens the Create Workspace Dialog (same dialog used in WorkspaceSwitcher). Reuse the same Dialog — do NOT duplicate it.

`DashboardSkeleton`: Use `Skeleton` component, matching the visual grid layout.

**GUARDRAIL**: Page component contains NO business logic. All Firestore and auth logic via hooks.

---

### Phase D: Content Ingestion UI

---

#### T016 — Create AddLectureDialog component

**File**: `src/components/lectures/add-lecture-dialog.tsx`

```tsx
"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLectureDialog({ open, onOpenChange }: AddLectureDialogProps) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    // Phase 3 will implement: JSON validation + Firestore write
    // For now: close the dialog only
    setValue("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Lecture</DialogTitle>
          <DialogDescription>
            Paste your NotebookLM JSON below. Processing will begin when you click Add.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Paste NotebookLM JSON here..."
          className="min-h-[200px] font-mono text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleAdd}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**GUARDRAIL**: No `JSON.parse()`. No `zod.parse()`. No Firestore calls. UI shell only.

---

#### T017 — Install Dialog and Textarea shadcn components

**CLI command**:
```bash
npx shadcn@latest add dialog textarea
```

**Expected output**: Creates `src/components/ui/dialog.tsx`, `textarea.tsx`.

---

#### T018 — Wire AddLectureDialog into Sidebar

**File**: `src/components/layout/sidebar.tsx`

Add a state flag `addLectureOpen` with `useState(false)`. Place an "Add Lecture" button in the bottom section of the Sidebar:
```tsx
<Button
  variant="outline"
  className="w-full justify-start gap-2"
  onClick={() => setAddLectureOpen(true)}
>
  <Plus className="h-4 w-4" />
  Add Lecture
</Button>
<AddLectureDialog open={addLectureOpen} onOpenChange={setAddLectureOpen} />
```

---

### Phase E: Placeholder Pages & Polish

---

#### T019 — Create Subjects and Settings placeholder pages

**Files**: `src/app/(protected)/subjects/page.tsx`, `src/app/(protected)/settings/page.tsx`

Simple, identical structure:
```tsx
export default function SubjectsPage() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>Subjects — coming in Phase 3.</p>
    </div>
  );
}
```

---

#### T020 — Final verification build

**Command**:
```bash
npm run build
```

**Must exit code 0**. Zero TypeScript errors. Zero ESLint errors (warnings acceptable).

---

## Verification Plan

### Manual Verification Matrix

| # | Step | Expected Result |
|---|---|---|
| 1 | Open `/login` | Email/password form AND Google button visible. Dark mode default. |
| 2 | Sign up with new email | Account created, redirected to `/`. |
| 3 | Sign in with wrong password | Inline "Incorrect password." error on password field — no browser alert. |
| 4 | Sign in with Google | Redirected to `/`. |
| 5 | Open `/` (no workspace) | Empty state card visible. "Create workspace" prompt shown. |
| 6 | Create first workspace | Workspace appears in Sidebar switcher. Dashboard title updates. |
| 7 | Create second workspace | Switcher shows both. Clicking each switches active workspace. |
| 8 | View dashboard | All 4 charts render with visible data. No blank states. |
| 9 | Resize to 375 px width | Sidebar hidden. Hamburger icon visible. |
| 10 | Tap hamburger | Sheet slides in with full Sidebar content. |
| 11 | Tap "Add Lecture" | Dialog opens with textarea. |
| 12 | Type text, click "Add" | Dialog closes. No crash. No Firestore writes. |
| 13 | Click "Sign Out" dropdown | Session cleared. Redirected to `/login`. |
| 14 | Navigate to `/subjects` | "Coming in Phase 3" placeholder shown in Sidebar layout. |
| 15 | `npm run build` | Exit code 0. Zero errors. |

### Automated Check

```bash
npm run build
# Exit code must be 0
```

No existing test suite — manual verification matrix is the primary gate for this phase.
