# Feature Specification: Phase 7 - Daily Tadabbur & Gemini Integration

**Feature Branch**: `007-daily-tadabbur-gemini`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: Phase 7 - Daily Tadabbur & Gemini Integration. Spiritual Layer via Hybrid AI/API. Batch Generation Strategy for 7 days into database. External LLM and Quran API.

## Clarifications

### Session 2026-02-24
- Q: How should the batch generator ensure the AI doesn't pick the exact same Surah/Ayah it picked recently, preventing the user from seeing identical content weeks in a row? → A: Query Firestore for the last 30 generated verses and pass them into the Gemini Prompt as "Do not use these".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Viewing Daily Tadabbur (Priority: P1)

As a student using the application, I want to see a daily spiritual insight (Tadabbur) with an authentic Quranic verse and a relatable story, so that I can reflect on faith, patience, and science during my studies.

**Why this priority**: Core feature value. This is the main interaction point for the user with the new spiritual layer.

**Independent Test**: Can be tested by visiting the dashboard and viewing the Daily Tadabbur widget. It delivers immediate daily value.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** the widget loads, **Then** it displays the authentic text of the daily verse, a localized Arabic AI story below it, and action buttons ("الحمد لله" and "قصص مشابهة").
2. **Given** the user views the insight, **When** they click "الحمد لله", **Then** the insight is marked as read or dismissed for the day.

---

### User Story 2 - Batch Generation of Insights (Priority: P2)

As an administrator or system process, I want to generate 7 days of daily insights at once using an AI service and store them in the database, so that the app performs quickly for users without rate limits or high latency.

**Why this priority**: Crucial for performance and cost management (batch generation vs on-demand).

**Independent Test**: Can be tested by invoking the batch generation process and verifying that 7 new documents are created in the database for the upcoming week.

**Acceptance Scenarios**:

1. **Given** the system needs new insights, **When** the generation action is triggered, **Then** it connects to the AI provider, generates 7 structured JSON objects based on the strict prompt, and writes them to the database.
2. **Given** the AI prompt is executed, **When** the text is generated, **Then** it strictly follows the rules (respectful Islamic Mentor, localized Egyptian Arabic, no personal interpretation of verses).

### Edge Cases

- What happens when the AI API fails, times out, or returns invalid JSON? (Fallback to previous/offline insights or show a graceful error).
- How does the system handle fetching from the external Quran API if the service is down? (Show a fallback or previously cached verse).
- What happens if the batch generation selects a verse reference that does not exist? (Validation needed before saving to the database).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a server-side action to connect to the AI API and generate 7 days of content in a single batch.
- **FR-002**: The Server-side action MUST query the database for the last 30 generated verses and include them in the prompt to prevent the AI from generating duplicate insights.
- **FR-003**: System MUST use a strictly crafted System Prompt to enforce respectful Egyptian Arabic, focus on specific topics (patience, science, faith), and forbid personal interpretation (Tafsir hallucination).
- **FR-003**: System MUST parse the structured AI response and batch-write to the database.
- **FR-004**: System MUST fetch the authentic Quranic text and audio from a trusted external API client-side using the generated Surah and Ayah numbers.
- **FR-005**: The UI Component MUST display the verse, the AI story, and the actionable buttons ("الحمد لله" and "قصص مشابهة").
- **FR-006**: System MUST securely handle external AI provider API keys.

### Key Entities *(include if feature involves data)*

- **Daily Insight**: Represents one day's spiritual content, containing the target display date, topic keywords, the AI story, and the exact external references (Surah/Ayah numbers).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard loads the Daily Tadabbur widget in under 1 second (no real-time AI generation blocking the UI).
- **SC-002**: Batch generation successfully stores 7 days of valid insights without hitting external rate limits.
- **SC-003**: 100% of displayed authentic text is fetched accurately from the external provider with zero AI alterations.
