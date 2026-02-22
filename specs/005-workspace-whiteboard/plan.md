# Implementation Plan: Workspace Whiteboard

**Branch**: `005-workspace-whiteboard` | **Date**: 2026-02-22 | **Spec**: [specs/005-workspace-whiteboard/spec.md](spec.md)
**Input**: Feature specification from `/specs/005-workspace-whiteboard/spec.md`

## Summary

Integrate an interactive digital whiteboard using the `@excalidraw/excalidraw` library bounded to a specific workspace (`/workspaces/[workspaceId]/board`). The persistent state (strokes, notes, etc.) will be automatically backed up via a debounced write to Firestore `workspaces/[id]/board/state`, allowing students to freely visualize concepts alongside their lectures.

## Technical Context

**Language/Version**: TypeScript (Next.js App Router)
**Primary Dependencies**: `@excalidraw/excalidraw`, `framer-motion`, `lucide-react`, `zod`, `shadcn/ui`
**Storage**: Firebase Firestore (`workspaces/{wid}/board/state`)
**Target Platform**: Web (Desktop optimized, tablet compatible)
**Project Type**: Web Application Feature
**Constraints**: **CRITICAL:** Excalidraw MUST be imported dynamically (`next/dynamic` with `ssr: false`). Standard imports will throw immediate Next.js App Router build/hydration errors.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Framework**: Next.js App Router route setup correctly (`app/(protected)/workspaces/[workspaceId]/board/page.tsx`).
- [x] **Styling**: Tailwind CSS for the wrapper layout `h-[calc(100vh-var(--header-height))]`.
- [x] **UI Components**: `shadcn/ui` `Skeleton` used for Excalidraw's initial loading state.
- [x] **Backend & Auth**: Data seamlessly attached to existing Firestore `workspaces` collection structure.
- [x] **Theming**: Excalidraw `theme` prop strictly bound to `useTheme()` from `next-themes` (light/dark mapped correctly).
- [x] **State Management**: Adheres to the requested debounced save hook (using custom `useDebounce` or inline `setTimeout` ref logic) to reduce Firestore burn.
- [x] **Mandatory Libraries**: Explicit package installation (`npm install @excalidraw/excalidraw`) included. No unapproved DBs or routers introduced.

## Project Structure

### Documentation (this feature)

```text
specs/005-workspace-whiteboard/
├── spec.md              
├── checklists/requirements.md
├── plan.md              # This file
├── data-model.md        
└── tasks.md             # (To be generated)
```

### Source Code

```text
src/
├── app/(protected)/workspaces/[workspaceId]/board/
│   └── page.tsx      # Target page routing
├── components/workspaces/board/
│   ├── excalidraw-wrapper.tsx # The Next.js dynamic ssr:false wrapper containing the actual Excalidraw canvas
│   └── board-loading.tsx      # Shadcn skeleton displayed while fetching/loading
└── hooks/
    └── use-debounced-save.ts  # Generic debounce helper for the auto-save trigger
```

**Structure Decision**: A dedicated sub-route `/workspaces/[workspaceId]/board` is utilized. The component structure cleanly separates the heavy, client-only Excalidraw library into `excalidraw-wrapper.tsx` which allows the parent page to fetch Firestore data and handle the `next/dynamic` loading skeleton gracefully.

## Complexity Tracking

> No violations of Constitution detected. The dynamic import constraint is standard for pure-client rendering libraries in Next.js.
