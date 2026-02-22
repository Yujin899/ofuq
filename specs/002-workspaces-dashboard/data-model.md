# Data Model: Phase 2 — Workspaces & Dashboard

**Branch**: `002-workspaces-dashboard` | **Date**: 2026-02-22

---

## TypeScript Interfaces

### User (amended from Phase 1)

```typescript
// src/types/auth.ts — no change to interface shape; Firebase now supports
// both Google and Email/Password providers for the same AuthUser shape.
export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
```

---

### Workspace

```typescript
// src/types/workspace.ts
import { Timestamp } from "firebase/firestore";

export interface Workspace {
  id: string;                  // Firestore document ID (set after read)
  ownerId: string;             // Firebase Auth uid of the owner
  name: string;                // Display name, 1–50 characters
  createdAt: Timestamp;        // Firestore server timestamp
}

export interface CreateWorkspaceInput {
  name: string;                // Validated: min 1 char, max 50 chars
}

export interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<void>;
  loading: boolean;
  error: Error | null;
}
```

**Firestore Collection**: `/workspaces`
**Security Rule (minimum)**: `request.auth.uid == resource.data.ownerId`
**Indexes**: Query by `ownerId` (ascending `createdAt`) — composite index required.

---

### Subject

```typescript
// src/types/subject.ts
import { Timestamp } from "firebase/firestore";

export interface Subject {
  id: string;                  // Firestore document ID
  workspaceId: string;         // Parent workspace ID
  name: string;                // Display name, 1–50 characters
  createdAt: Timestamp;
}
```

**Firestore Collection**: `/subjects`
**Security Rule (minimum)**: Caller must own the parent workspace (`get(/databases/$(database)/documents/workspaces/$(resource.data.workspaceId)).data.ownerId == request.auth.uid`).
**Note**: Subject creation UI is **not** in this phase. Interface defined for Phase 3 consumption.

---

## Mock Data Types

```typescript
// src/lib/mock-data.ts (types only shown — full values in the file itself)

export interface StudyMinuteDataPoint {
  date: string;      // e.g. "2026-02-01"
  minutes: number;
}

export interface TimePerSubjectDataPoint {
  subject: string;
  minutes: number;
  fill: string;      // CSS variable token e.g. "var(--chart-1)"
}

export interface QuizScoreDataPoint {
  subject: string;
  score: number;     // 0–100
}

export interface DailyGoalDataPoint {
  name: string;      // "Goal" | "Achieved"
  value: number;     // 0–100 percentage
  fill: string;      // CSS variable token
}
```

---

## Firestore Collection Summary

| Collection | Key Fields | Query Pattern | ACL |
|---|---|---|---|
| `/workspaces` | `ownerId`, `name`, `createdAt` | `where("ownerId", "==", uid)` | Owner only |
| `/subjects` | `workspaceId`, `name`, `createdAt` | `where("workspaceId", "==", wsId)` | Owner via workspace |

---

## No Firestore in Phase 2 (Charts)

All chart data is sourced from `src/lib/mock-data.ts`. No Firestore reads for dashboard charts until Phase 3.
