# Research: Feature 004 — Add Lecture via NotebookLM

**Branch**: `004-add-lecture-notebooklm`  
**Created**: 2026-02-22  

---

## Decision 1: Route vs. Modal for Lecture Creation

**Decision**: Full-page route at `/workspaces/[workspaceId]/subjects/[subjectId]/add-lecture`  
**Rationale**: The four-step workflow (read instructions → open external tool → copy prompt → paste and validate JSON) has too many sequential states and too much content to fit ergonomically in a dialog. A full page allows the layout to breathe and matches the Notion-like aesthetic.  
**Alternatives Considered**: `Dialog` (too small for the workflow); `Sheet`/`Drawer` (still too cramped; scroll UX is awkward on mobile).

---

## Decision 2: NotebookLM Integration Strategy

**Decision**: Guided copy-paste workflow with an external link button and clipboard API  
**Rationale**: Google blocks third-party embedding of NotebookLM via `X-Frame-Options`. An iframe is technically impossible. The copy-paste approach is the only viable integration path without involving a custom backend API.  
**Alternatives Considered**: A backend API calling NotebookLM programmatically — out of scope and requires credentials management beyond current architecture.

---

## Decision 3: Prompt Storage Location

**Decision**: Store the Dr. Molar prompt as a typed constant in `src/lib/constants/prompts.ts`  
**Rationale**: Separating the prompt from the UI component makes it independently versioned, reusable, and testable. A constant file is the simplest, most auditable approach.  
**Alternatives Considered**: Env var (prompts are not secrets, no reason for env scope); Firestore document (adds read latency and complexity for static content).

---

## Decision 4: Zod Schema Redesign

**Decision**: Replace the existing `lecture.ts` schema entirely with a new one matching the Dr. Molar prompt output  
**Rationale**: The current schema (`correctAnswer: string`, 3 reflection questions as strings) is fundamentally incompatible with the new format (`correctAnswers: number[]`, question `type` enum, `modelAnswer` on reflection questions). A clean replacement is safer than patching.  
**Alternatives Considered**: Extending the existing schema — rejected because the structural incompatibilities would require extensive workarounds that would obscure intent.

---

## Decision 5: Firestore Write Path

**Decision**: Write the lecture document to `workspaces/{workspaceId}/subjects/{subjectId}/lectures/{lectureId}`  
**Rationale**: Consistent with the existing sub-collection architecture established for subjects. This maintains natural hierarchical ownership and avoids the need for cross-collection index queries.  
**Alternatives Considered**: Root `lectures` collection with `workspaceId`/`subjectId` fields — rejected as it requires composite indexes and is architecturally inconsistent.

---

## Decision 6: Subjects Page Navigation Update

**Decision**: Replace `AddLectureDialog` trigger with a Next.js `router.push()` call to the new route  
**Rationale**: The dialog component is deprecated by this feature. The Subjects page's "Add Lecture" button must navigate rather than open a dialog.  
**Alternatives Considered**: Keep dialog as a redirect wrapper — unnecessary complexity; delete it cleanly.
