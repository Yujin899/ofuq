# Data Model: Feature 004 — Add Lecture via NotebookLM

**Branch**: `004-add-lecture-notebooklm`  
**Created**: 2026-02-22  

---

## Entity: Lecture

**Firestore Path**: `workspaces/{workspaceId}/subjects/{subjectId}/lectures/{lectureId}`  
**Who creates it**: The authenticated user, by pasting validated JSON on the Add Lecture page.  
**Who reads it**: The user on the Subjects page (list view) and future Study Loop pages (detail view).

### Fields

| Field | Type | Required | Notes |
|-|-|-|-|
| `title` | `string` | ✅ | User-facing lecture name |
| `intro` | `string` | ✅ | 3-4 paragraphs from Dr. Molar (replaces `introSummary`) |
| `reflectionQuestions` | `ReflectionQuestion[]` | ✅ | Exactly 4 items |
| `quiz` | `QuizQuestion[]` | ✅ | 20–25 items, mixed types |
| `createdAt` | `Timestamp` | ✅ | Set by server on write |
| `subjectId` | `string` | ✅ | Redundant field for sub-collection queries |
| `workspaceId` | `string` | ✅ | Redundant field for top-level filtering |

---

## Entity: ReflectionQuestion

**Lives inside**: `Lecture.reflectionQuestions[]`

| Field | Type | Required | Notes |
|-|-|-|-|
| `question` | `string` | ✅ | Open-ended conceptual question |
| `modelAnswer` | `string` | ✅ | 3-5 sentence answer by Dr. Molar |

---

## Entity: QuizQuestion

**Lives inside**: `Lecture.quiz[]`

| Field | Type | Required | Notes |
|-|-|-|-|
| `type` | `"single" \| "multi" \| "case"` | ✅ | Determines badge rendering |
| `question` | `string` | ✅ | MCQ stem |
| `options` | `string[]` | ✅ | 4–5 items |
| `correctAnswers` | `number[]` | ✅ | 0-indexed. Length=1 for `single`/`case`, 2+ for `multi` |
| `explanation` | `string` | ✅ | Describes why correct/incorrect |

---

## Zod Schema (New — replaces `src/lib/validations/lecture.ts`)

```typescript
const ReflectionQuestionSchema = z.object({
  question: z.string().min(1),
  modelAnswer: z.string().min(1),
});

const QuizQuestionSchema = z.object({
  type: z.enum(["single", "multi", "case"]),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(4).max(5),
  correctAnswers: z.array(z.number().int().nonnegative()),
  explanation: z.string().min(1),
});

const LectureImportSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
  reflectionQuestions: z.array(ReflectionQuestionSchema).length(4),
  quiz: z.array(QuizQuestionSchema).min(20).max(25),
});
```

---

## TypeScript Interface (New — replaces `src/types/lecture.ts`)

```typescript
export type QuestionType = "single" | "multi" | "case";

export interface ReflectionQuestion {
  question: string;
  modelAnswer: string;
}

export interface QuizQuestion {
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

export interface Lecture {
  id: string;
  workspaceId: string;
  subjectId: string;
  title: string;
  intro: string;
  reflectionQuestions: ReflectionQuestion[];
  quiz: QuizQuestion[];
  createdAt: Timestamp;
}
```

---

## State Transitions

```
User lands on Add Lecture page
  → idle (textarea empty, submit disabled)
  → user pastes JSON
  → submitting (spinner, submit button disabled)
    → validation FAIL → idle + inline error toast displayed
    → validation PASS → Firestore write → redirect to /subjects page
```
