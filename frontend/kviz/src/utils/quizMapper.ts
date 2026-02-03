import type { QuizDraft } from "../types/quiz";
import type { CreateQuizRequestDTO } from "../types/dto";

export function mapDraftToCreateQuizDTO(draft: QuizDraft): CreateQuizRequestDTO {
  return {
    title: draft.title.trim(),
    duration_seconds: Number(draft.duration_seconds),
    authorId: draft.authorId,
    questions: draft.questions.map((q) => ({
      text: q.text.trim(),
      points: Number(q.points),
      answers: q.answers.map((a) => ({
        text: a.text.trim(),
        isCorrect: Boolean(a.isCorrect),
      })),
    })),
  };
}
