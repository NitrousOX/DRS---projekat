export type CreateQuizRequestDTO = {
  title: string;
  durationSeconds: number;
  authorId?: string;
  questions: CreateQuizQuestionDTO[];
};

export type CreateQuizQuestionDTO = {
  text: string;
  points: number;
  answers: CreateQuizAnswerDTO[];
};

export type CreateQuizAnswerDTO = {
  text: string;
  isCorrect: boolean;
};
