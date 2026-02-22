<!--
  SYNC IMPACT REPORT
  ===========================================================================
  Version change: N/A (initial) → 1.0.0
  Modified principles: N/A (first ratification)
  Added sections:
    - Principle I: Technology Stack & Architecture
    - Principle II: Design & UI/UX Standards
    - Principle III: State Management & Data Handling
    - Principle IV: Code Quality & AI Adherence
  Added custom sections:
    - Mandatory Libraries & Versions
    - Development Workflow
  Removed sections: None
  Templates requiring updates:
    - plan-template.md    ✅ No update required (generic; constitution check
      section will be filled per-feature by /speckit.plan)
    - spec-template.md    ✅ No update required (generic)
    - tasks-template.md   ✅ No update required (generic)
  Follow-up TODOs: None
  ===========================================================================
-->

# Ofuq (أفق) Constitution

## Core Principles

### I. Technology Stack & Architecture

- **Framework**: Next.js with the App Router MUST be used for all
  routing and page rendering. Pages Router is NOT permitted.
- **Styling**: Tailwind CSS MUST be the sole styling solution.
  Raw CSS files, CSS-in-JS libraries, and inline `style` attributes
  are NOT permitted unless required by a third-party dependency.
- **UI Components**: `shadcn/ui` MUST be used for every UI primitive
  (Button, Dialog, Input, Card, etc.). A custom component MUST NOT be
  created when a `shadcn/ui` equivalent exists.
- **Animations**: `framer-motion` MUST be used for page transitions
  within the study loops and for any non-trivial animation. Tailwind
  `animate-*` utilities MAY be used for micro-interactions
  (hover states, spinners).
- **Backend & Auth**: Firebase MUST be the exclusive backend.
  Firestore is the database; Firebase Authentication with Google as
  the sign-in provider handles user identity.
  No alternative BaaS or custom backend is permitted.
- **Theming**: `next-themes` MUST manage light/dark mode switching.
  Dark mode MUST be the default theme.

### II. Design & UI/UX Standards

- **Aesthetic**: The interface MUST follow a minimalist, clean,
  Notion-like design language. Cluttered layouts, excessive
  ornamentation, and non-essential visual elements are NOT permitted.
- **Dashboard Charts**: All charts MUST be rendered using `recharts`
  through the `shadcn/ui` chart wrappers (AreaChart, PieChart,
  BarChart, RadialBarChart). No external charting library (Chart.js,
  D3, Nivo, etc.) is permitted.
- **Theme Consistency**: ALL custom colours and spacing tokens MUST
  be defined as CSS variables in `hsl(var(--<token>))` format so
  that light and dark modes toggle seamlessly without conditional
  class logic.

### III. State Management & Data Handling

- **Persistent Data**: Firebase Firestore MUST store all persistent
  entities: Workspaces, Subjects, and Lectures.
- **Ephemeral State**: React component state or a lightweight store
  MUST manage the Study Loop Timer. The count-up timer MUST:
  1. Run locally with minimal re-renders.
  2. Handle browser tab switches gracefully (e.g., using
     `document.visibilitychange` or `requestAnimationFrame`).
  3. Trigger periodic motivational notifications.
- **JSON Ingestion**: Lectures are created by pasting JSON generated
  by NotebookLM. Before any JSON reaches Firestore:
  1. A Zod schema MUST validate the pasted payload.
  2. Validation errors MUST be surfaced to the user with clear,
     actionable messages.
  3. Malformed payloads MUST NOT be written to Firestore under
     any circumstance.

### IV. Code Quality & AI Adherence

- **Language**: TypeScript MUST be used across the entire codebase
  with `strict` mode enabled in `tsconfig.json`.
  All types and interfaces MUST be explicitly defined — especially
  for the NotebookLM JSON schema and Firestore document shapes.
- **Modularity**: Complex or reusable logic MUST be extracted into
  custom hooks (e.g., `useStudyTimer`, `useWorkspaceData`).
  Business logic MUST NOT reside directly in page or layout
  components.
- **Anti-Hallucination**: The AI agent MUST strictly follow these
  specifications. It MUST NOT:
  1. Invent features not present in the approved specification.
  2. Substitute, swap, or add technologies outside the approved
     stack without explicit user approval.
  3. Deviate from the Notion-like aesthetic defined in Principle II.

## Mandatory Libraries & Versions

| Category | Library | Notes |
|---|---|---|
| Framework | `next` (App Router) | Latest stable |
| Styling | `tailwindcss` | Latest v4+ |
| UI Kit | `shadcn/ui` | CLI-installed components |
| Animation | `framer-motion` | Page transitions & study loops |
| Charts | `recharts` | Via `shadcn/ui` chart wrappers |
| Theming | `next-themes` | Dark mode default |
| Backend | `firebase` / `firebase-admin` | Auth + Firestore |
| Validation | `zod` | JSON ingestion schema |
| Language | TypeScript (`strict`) | Entire codebase |

Adding a library outside this table requires explicit user approval
and an amendment to this constitution.

## Development Workflow

- **Component-first**: Build and test individual `shadcn/ui`-based
  components before assembling pages.
- **Type-driven**: Define Zod schemas and TypeScript interfaces
  before implementing the feature that consumes them.
- **Hook extraction**: When a component exceeds ~50 lines of
  non-JSX logic, extract into a dedicated hook under `hooks/`.
- **Commit discipline**: Each commit SHOULD represent a single
  logical change (one feature, one fix, one refactor).
- **Accessibility**: Leverage built-in `shadcn/ui` ARIA attributes;
  every interactive element MUST be keyboard-navigable.

## Governance

- This Constitution is the highest-authority document for the Ofuq
  project. It supersedes all other practices, guidelines, and ad-hoc
  decisions.
- **Amendments** require:
  1. A written proposal describing the change and its rationale.
  2. Explicit user approval before the amendment takes effect.
  3. An updated version number following Semantic Versioning
     (MAJOR for principle removals/redefinitions, MINOR for
     additions/expansions, PATCH for clarifications/typos).
- **Compliance review**: Every specification, plan, and task list
  generated by speckit commands MUST include a Constitution Check
  gate that verifies adherence to these principles before
  implementation proceeds.

**Version**: 1.0.0 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-02-22
