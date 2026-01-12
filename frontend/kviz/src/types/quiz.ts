export type Role = "IGRAC" | "MODERATOR" | "ADMIN";

export type QuizDraft = {
  title: string;
  durationSeconds: number;
  authorId?: string;
  questions: QuizDraftQuestion[];
};

export type QuizDraftQuestion = {
  id: string;
  text: string;
  points: number;
  answers: QuizDraftAnswer[];
};

export type QuizDraftAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
};
