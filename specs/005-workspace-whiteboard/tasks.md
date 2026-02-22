---
description: "Task list for Phase 5 Workspace Whiteboard (Excalidraw Integration)"
---

# Tasks: Workspace Whiteboard

**Input**: Design documents from `/specs/005-workspace-whiteboard/`
**Prerequisites**: plan.md, spec.md, data-model.md

## 🚨 FLASH GUARDRAILS (CRITICAL 🚨
1. **SSR Bypass**: MUST use `next/dynamic` with `{ ssr: false }` for the Excalidraw component to prevent build errors.
2. **Debounced Saves**: MUST implement a debounced Firestore save (2-second delay) for `elements` and `appState` to optimize database writes.
3. **Theme Sync**: MUST sync the Excalidraw UI theme seamlessly with `next-themes`.
4. **Layout**: MUST use `shadcn/ui` Skeletons for the loading state and ensure the board takes up the full remaining viewport height `h-[calc(100vh-var(--header-height))]` or similar.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Package installation and generic helpers.

- [ ] T001 Install `@excalidraw/excalidraw` package via npm
- [ ] T002 Implement generic `useDebounce` hook in `src/hooks/use-debounce.ts` (or utilize `lodash.debounce` if already present)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Setup the Firebase API logic for reading and writing the whiteboard state.

- [ ] T003 Expose Firebase client functions in `src/lib/firebase/db.ts` (or equivalent service) to fetch and set (`merge: true`) the `workspaces/{workspaceId}/board/state` document.
- [ ] T004 Define TypeScript interfaces for the Firestore Board State payload in `src/types/` (referencing `ExcalidrawElement` and `AppState` loosely without strictly typing the entire Excalidraw internal API).

---

## Phase 3: User Story 1 - View Whiteboard (P1)

**Goal**: As a student, I want to access a digital whiteboard within my workspace so that I can visualize concepts.

- [ ] T005 [US1] Create the loading Skeleton Component `BoardLoading` in `src/components/workspaces/board/board-loading.tsx`.
- [ ] T006 [US1] Create the core `ExcalidrawWrapper` component in `src/components/workspaces/board/excalidraw-wrapper.tsx` that exports the actual Excalidraw canvas. 
- [ ] T007 [US1] Implement theme synchronization inside `ExcalidrawWrapper` using `next-themes` `useTheme`.
- [ ] T008 [US1] Create the dynamic route page `src/app/(protected)/workspaces/[workspaceId]/board/page.tsx`.
- [ ] T009 [US1] Inside the page, import `ExcalidrawWrapper` dynamically using `next/dynamic` strictly with `{ ssr: false }`.
- [ ] T010 [US1] Assemble the page layout using Tailwind to ensure it takes the full remaining viewport height without double scrollbars.

---

## Phase 4: User Story 2 - Save & Persist Progress (P1)

**Goal**: As a student, I want my whiteboard drawings to be automatically saved to my workspace.

- [ ] T011 [US2] Update `src/app/(protected)/workspaces/[workspaceId]/board/page.tsx` to handle fetching the initial state from Firestore on mount.
- [ ] T012 [US2] Pass the fetched `elements` and `appState` into the `ExcalidrawWrapper` as `initialData`. Ensure a clean, empty canvas is passed if the document doesn't exist yet.
- [ ] T013 [US2] Implement the `onChange` event handler in `ExcalidrawWrapper` that receives updated elements and appState.
- [ ] T014 [US2] Debounce the `onChange` event data (2000ms) and trigger the Firestore save function established in T003.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanups.

- [ ] T015 Verify the dynamic import works correctly by successfully running `npm run build`.
- [ ] T016 Verify network tab behaviour to ensure the debounce is correctly limiting Firestore writes to exactly 1 write per session pause.
- [ ] T017 Final visual QA alongside the rest of the workspace dashboard routing.
