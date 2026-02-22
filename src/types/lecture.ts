import { Timestamp } from "firebase/firestore";

export type QuestionType = "single" | "multi" | "case";

export interface QuizQuestion {
    type: QuestionType;
    question: string;
    options: string[];
    correctAnswers: number[]; // 0-indexed
    explanation: string;
}

export interface Lecture {
    id: string;
    workspaceId: string;
    subjectId: string;
    title: string;
    intro: { en: string; ar: string };
    quiz: QuizQuestion[];
    createdAt: Timestamp;
}
