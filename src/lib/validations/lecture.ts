import { z } from "zod";

export const QuizQuestionSchema = z.object({
    type: z.enum(["single", "multi", "case"], {
        message: 'Question type must be "single", "multi", or "case"',
    }),
    question: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1)).min(4).max(5),
    correctAnswers: z
        .array(z.number().int().nonnegative())
        .min(1, "At least one correct answer index required"),
    explanation: z.string().min(1, "Explanation is required"),
});

export const LectureImportSchema = z.object({
    title: z.string().min(1, "Lecture title is required"),
    intro: z.object({
        en: z.string().min(1, "English intro is required"),
        ar: z.string().min(1, "Arabic intro is required"),
    }),
    quiz: z
        .array(QuizQuestionSchema)
        .min(20, "Quiz must have at least 20 questions")
        .max(25, "Quiz must have no more than 25 questions"),
});

export type LectureImport = z.infer<typeof LectureImportSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
