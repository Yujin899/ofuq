# 🧐 Reality Check Report: ofuq
**Date**: March 17, 2026
**Agent**: TestingRealityChecker

## 1. Folder Structure
*Actual tree based on `src/` directory components:*
- `src/app/`: Next.js App Router containing `(auth)` and `(protected)` route groups, handling workspaces, subjects, journeys, and members pages.
- `src/components/`:
  - `auth/`: Protected route wrappers.
  - `dashboard/`: Stats charts (placeholder components).
  - `layout/`: App shell, sidebar, and navigation.
  - `providers/`: Auth and Workspace context providers.
  - `ui/`: shadcn/ui generic primitives.
  - `workspaces/`: Core study features (`horizon-trail.tsx`, `journey-builder.tsx`, `journeys-list.tsx`).
- `src/lib/`: Firebase initialization (`firebase.ts`) and database helpers.
- `src/hooks/`: Custom React hooks, notably `use-presence.ts`.
- `src/types/`: TypeScript definitions (`workspace.ts`, `subject.ts`, `lecture.ts`, `journey.ts`).

## 2. Tech Stack
**Expected vs. Actual:**
- **Frontend**: Next.js 16.1.6, React 19.2.3. *(MATCH)*
- **Styling**: Tailwind CSS v4, Framer Motion v12.34.3, shadcn/ui. *(MATCH)*. Verified `globals.css` uses strict OKLCH light mode variables without `dark:` mode directives.
- **Backend**: Firebase 12.9.0 (Firestore + RTDB). *(MATCH)*

## 3. Feature Status
Based on actual codebase implementation:
- **The Horizon Trail**: **PARTIAL.** `horizon-trail.tsx` exists and uses Framer Motion (`popLayout`). However, automated progression logic based strictly on quiz scores (>=60%) is absent from the codebase.
- **Multiplayer Journeys**: **PARTIAL.** Firestore sync exists. Avatars display based on RTDB presence, but specific dynamic gathering spot expansion and "Fanned Layouts" require visual verification to confirm compliance.
- **Multiplayer Presence System**: **DONE.** `use-presence.ts` actively uses Firebase RTDB to track real-time online status and syncs effectively with `horizon-trail.tsx`.
- **Smart Leaderboard**: **NOT STARTED.** `members/page.tsx` has a shell for "Community & Leaderboard", but the specific calculation formula `(Hours_Studied * 10) + (Avg_Quiz_Accuracy * 0.5) + (Completed_Lectures * 5)` does not exist anywhere in the code.

## 4. Data Models
*Actual Firestore/RTDB structures found in code:*
- **Workspaces**: `id`, `createdAt` (Firestore server timestamp).
- **Subjects**: Path: `workspaces/{wid}/subjects/{sid}`.
- **Lectures**: Path: `workspaces/{wid}/subjects/{sid}/lectures/{lid}`.
- **Journeys**: Path: `workspaces/{wid}/journeys/{jid}`.
- **Presence (RTDB)**: Map of `uid` to `UserStatus` tracking state ("online"), `journeyId`, and `stepIndex`.

## 5. Component Map
- `horizon-trail.tsx`: Renders the zigzag study path, mapping `memberPresences` to UI avatars. Subscribes to `use-presence.ts`.
- `journey-builder.tsx`: Handles creation of steps (`lecture`, `placeholder`). Connects to Firestore.
- `journeys-list.tsx`: Lists available journeys for a workspace. Connects to Firestore.
- `dashboard/*-chart.tsx`: Static Recharts components awaiting real data integration.
- `providers/auth-provider.tsx`: Syncs Firebase Auth state to Firestore user documents.

## 6. Gaps (Referenced but missing)
- **Quiz System**: `skills.md` mandates progression based on a quiz score >= 60%. While dashboard charts mention quizzes, there is NO actual quiz taking interface or submission logic that gates `horizon-trail` progress.
- **Leaderboard Logic**: The weighted scoring formula is completely non-existent.
- **Milestone Checkpoints**: `skills.md` mentions larger nodes ("Checkpoints") every 5th step with a "Tent" icon. This logic is not explicitly isolated or evident in `horizon-trail.tsx`.

## 7. Inconsistencies
- **Quiz vs. Progress**: The trail progression relies on standard Firestore updates right now. The strict "no manual Mark as Done buttons" rule cannot be enforced without the missing quiz module gating it.
- **Dashboard Charts**: The charts in `components/dashboard/` appear completely disconnected from actual user data models, acting as placeholders rather than reflecting actual `Hours_Studied` or `Avg_Quiz_Accuracy`.

---
**Reality Checker Certification**: FAILED / NEEDS WORK. Core progression mechanics (quizzes) and leaderboard logic are missing. Visual evidence required for multiplayer fanned layouts before certification.
