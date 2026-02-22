# Feature Specification: Add Lecture via NotebookLM

**Feature Branch**: `004-add-lecture-notebooklm`  
**Created**: 2026-02-22  
**Status**: Draft  

---

## Overview

This feature replaces the limited "Add Lecture" modal dialog with a dedicated, full-page guided workflow that teaches users how to use NotebookLM (Google's AI research tool) to generate structured, clinically-rich dental lecture content. The generated content is validated and stored as a structured JSON payload in the system.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add Lecture via NotebookLM Workflow (Priority: P1)

A logged-in student navigates to a workspace subject and wants to add a new lecture. They are guided step-by-step to open NotebookLM, copy a pre-engineered prompt, generate a JSON lecture payload, paste it back, and submit it for storage.

**Why this priority**: This is the core new capability. Without it, users cannot populate their subjects with study material.

**Independent Test**: Can be fully tested by navigating to `/workspaces/[workspaceId]/subjects/[subjectId]/add-lecture`, following the four steps, pasting valid JSON, and verifying the lecture appears on the Subjects page.

**Acceptance Scenarios**:

1. **Given** a user is on the Subjects page, **When** they click "Add Lecture" on a subject, **Then** they are navigated to the full-page Add Lecture route for that subject.
2. **Given** the user is on the Add Lecture page, **When** they view it, **Then** they see four clearly labelled steps with engaging, friendly instructions.
3. **Given** the user clicks "Open NotebookLM", **When** the button is clicked, **Then** NotebookLM opens in a new browser tab.
4. **Given** the user clicks "Copy Prompt", **When** they click the button, **Then** the pre-engineered system prompt is copied to the clipboard and the button shows a confirmation state ("Copied!").
5. **Given** the user pastes valid JSON into the textarea and clicks "Generate Lecture", **When** the form is submitted, **Then** the JSON is validated against the schema, the lecture is saved to the database, and the user is redirected to the Subjects page.
6. **Given** the user pastes invalid JSON, **When** they submit, **Then** an inline error message is shown describing the validation failure, and nothing is saved.

---

### User Story 2 — Quiz Badge Rendering by Question Type (Priority: P2)

During a quiz session (Phase 4), each question must be visually labelled with its type to set the user's expectation of how to answer.

**Why this priority**: Users need clear visual feedback to know if they should select one answer, multiple answers, or interpret a clinical case. Lack of this leads to confusion and wrong answers.

**Independent Test**: Can be tested independently by rendering a quiz component with a mix of `single`, `multi`, and `case` type questions and verifying the correct badge appears for each.

**Acceptance Scenarios**:

1. **Given** a question of type `single`, **When** rendered on the quiz page, **Then** a "Single Choice" badge (neutral style) is displayed.
2. **Given** a question of type `multi`, **When** rendered on the quiz page, **Then** a "Multiple Choice" badge (subtle style) is displayed.
3. **Given** a question of type `case`, **When** rendered on the quiz page, **Then** a "Clinical Case" badge (urgent/amber style) is displayed.

---

### User Story 3 — Self-Assessment via Reflection Questions (Priority: P3)

After completing a quiz, the user is shown the reflection questions with their model answers to enable deeper, conceptual self-assessment beyond the MCQ format.

**Why this priority**: Builds long-term retention by going beyond rote quiz answers and encouraging critical thinking.

**Independent Test**: Can be tested by completing a quiz and verifying a dedicated "Reflection" section appears at the end displaying all `question` and `modelAnswer` pairs.

**Acceptance Scenarios**:

1. **Given** a user has completed a quiz, **When** they reach the results screen, **Then** a "Reflection Questions" section is visible below the score.
2. **Given** a reflection question is displayed, **When** the user views it, **Then** both the `question` and the `modelAnswer` are shown in full.

---

### Edge Cases

- What if the user opens NotebookLM but the AI returns non-JSON text (e.g., markdown or a preamble)? → The validation step catches this and shows a clear error: "Invalid format. Please paste only the raw JSON output."
- What if the `quiz` array has fewer than 20 questions? → Validation fails and the user is informed of the minimum count requirement.
- What if the user navigates away mid-flow? → No data is saved (flow is client-side only until final submission).
- What if `core_subjects` has not been seeded (empty list)? → The Subjects page shows a friendly empty state, and the "Add Lecture" button is still accessible per subject with a note that subjects must exist first.
- What if a `case` question doesn't start with "A patient presents..."? → This is a soft constraint captured in the prompt, not enforced in the Zod schema (the AI is prompted to follow it, but schema validation only checks `type`, `question`, `options`, `correctAnswers`, `explanation`).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated, full-page route accessible at `/workspaces/[workspaceId]/subjects/[subjectId]/add-lecture`.
- **FR-002**: The Add Lecture page MUST present four distinct, numbered steps with engaging and clear user instructions.
- **FR-003**: The page MUST include an "Open NotebookLM" button that opens `https://notebooklm.google.com/` in a new browser tab.
- **FR-004**: The page MUST include a "Copy Prompt" button that copies a pre-engineered system prompt to the user's clipboard and temporarily changes its label to confirm the action.
- **FR-005**: The page MUST include a large, monospace textarea where the user can paste the JSON output from NotebookLM.
- **FR-006**: On submit, the system MUST validate the pasted JSON against the defined lecture schema before saving.
- **FR-007**: If validation fails, the system MUST display an inline, human-readable error message without saving any data.
- **FR-008**: If validation passes, the lecture MUST be saved to the database under the correct workspace and subject, and the user MUST be redirected to the Subjects page.
- **FR-009**: The system MUST store the pre-engineered NotebookLM prompt as a versioned constant in the codebase.
- **FR-010**: During a quiz, each question MUST be rendered with a visual badge indicating its type: `single`, `multi`, or `case`.
- **FR-011**: `case`-type questions MUST use a visually distinct, urgent-colored badge (amber/destructive) to signal clinical context.
- **FR-012**: After quiz completion, `reflectionQuestions` (each with `question` and `modelAnswer`) MUST be displayed to the user for self-assessment.

### JSON Schema (Lecture Payload)

The JSON submitted by the user must conform to this structure exactly:

```
{
  "intro": string (3-4 paragraphs connecting topic to clinical scenarios),
  "reflectionQuestions": [
    {
      "question": string,
      "modelAnswer": string
    }
  ] (exactly 4 items, first must be a conceptual hook),
  "quiz": [
    {
      "type": "single" | "multi" | "case",
      "question": string,
      "options": string[],
      "correctAnswers": number[] (0-indexed),
      "explanation": string
    }
  ] (20 to 25 items, must include at least one of each type)
}
```

### Key Entities

- **Lecture**: A structured study unit associated with a Subject. Contains an intro, reflection questions, and a quiz. Identified by a unique ID within the subject's sub-collection.
- **ReflectionQuestion**: A conceptual open-ended question with a model answer. Intended for self-assessment after the quiz. Part of the Lecture entity.
- **QuizQuestion**: A structured multiple-choice question with a type (`single`, `multi`, or `case`), answer options, correct answer indices, and an explanation.

### The NotebookLM Prompt (Versioned Constant)

The following prompt is designed to produce strictly-structured, clinically-rich dental lecture content. It must be stored in the codebase as `NOTEBOOK_LM_PROMPT`:

```
You are Dr. Molar, a world-renowned dental professor who is equal parts brilliant scientist and captivating storyteller. Your lectures are legendary — students actually look forward to them, which basically makes you a unicorn in academia.

A student has just uploaded their lecture notes or source material to you. Your mission, should you choose to accept it (and you will, because you're awesome), is to transform this material into a highly-structured study session.

You MUST output ONLY a single, raw, valid JSON object. No markdown. No intro text. No "Sure! Here's your JSON:". No trailing explanation. Just the raw JSON, starting with { and ending with }. A linter will parse your output directly, so a single extra character will break everything. You've been warned.

The JSON must contain exactly these three top-level keys:

1. "intro" (string):
Write 3 to 4 paragraphs. Do NOT summarize the notes boringly. Instead, OPEN with a vivid clinical patient scenario that makes the topic feel urgent and real. Connect the science directly to what a dentist will actually SEE, TOUCH, and DECIDE in a clinical encounter. Make the student feel like they are already in practice. Be charismatic and use humor where appropriate — a light joke lands better than a textbook sentence. End the intro with a motivational transition to the quiz.

2. "reflectionQuestions" (array of exactly 4 objects):
Each object has two keys: "question" (string) and "modelAnswer" (string).
- The FIRST question must be a conceptual HOOK — a "why does this even matter clinically?" question that forces the student to connect the dots before they even start the quiz.
- Questions 2-4 should test deeper understanding, application, and critical thinking — not just recall.
- Model answers should be thorough (3-5 sentences), clinically grounded, and written in the voice of a senior clinician explaining to a junior.
- Do NOT write trivial questions. If your question can be answered with a single word, it's too shallow.

3. "quiz" (array of 20 to 25 objects):
Each object must have: "type", "question", "options" (array of strings), "correctAnswers" (array of 0-indexed integers), and "explanation" (string).

Question types:
- "single": Exactly ONE correct answer. correctAnswers array has ONE index.
- "multi": TWO OR MORE correct answers. correctAnswers array has MULTIPLE indices. The stem MUST include the phrase "Select all that apply."
- "case": A clinical scenario. The stem MUST start with "A patient presents...". Exactly ONE correct answer. These should be the hardest and most clinically realistic questions.

Distribution rules:
- You MUST include at least 5 "single" questions, at least 5 "multi" questions, and at least 5 "case" questions.
- Spread them throughout the quiz — do not cluster all cases at the end.
- Explanations must be educational gold: explain WHY the correct answer is right AND why each wrong answer is wrong (or why it's tempting but incorrect).
- Options arrays should have 4 to 5 items.
- Do not repeat questions or trivially rephrase the same concept across multiple questions.

Begin now. Output only valid JSON.
```

---

## Assumptions

- The "Add Lecture" button on the Subjects page already exists and will be updated to navigate to the new route instead of opening a modal.
- The `add-lecture-dialog.tsx` component is deprecated and will be deleted as part of this feature.
- NotebookLM cannot be embedded via iframe (Google blocks this via X-Frame-Options), so the workflow is a guided copy-paste experience.
- The database write inserts the lecture document into the `workspaces/{workspaceId}/subjects/{subjectId}/lectures` sub-collection, consistent with existing architecture.
- Quiz rendering (Phase 4) is a separate feature; this spec only defines the data contract and badge rendering requirements. Implementation of the full quiz phase is out of scope for this feature.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the entire Add Lecture workflow — from navigating to the page to seeing the lecture on the Subjects page — in under 5 minutes (excluding time spent in NotebookLM).
- **SC-002**: 100% of submitted JSON payloads that fail schema validation are rejected before reaching the database, with a user-visible error message.
- **SC-003**: 100% of quiz questions rendered display the correct badge type matching their `type` field in the database.
- **SC-004**: The pre-engineered prompt produces a valid, parseable JSON payload on first attempt in at least 90% of test runs against NotebookLM.
- **SC-005**: All four reflection questions and their model answers are visible to the user on the post-quiz results screen without any additional navigation.
