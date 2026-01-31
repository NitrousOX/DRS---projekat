// src/api/quizApi.ts
import { quizHttp } from "./http";
import type { QuizDraft } from "../types/quiz";
import { mapDraftToCreateQuizDTO } from "../utils/quizMapper";

export type CreateQuizResponseDTO = {
  id: number | string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
};

type CreateQuestionDTO = { text: string; points: number };
type CreateQuestionResponseDTO = { question_id: number };

type CreateAnswerDTO = { text: string; is_correct: boolean };
type CreateAnswerResponseDTO = { answer_id: number };

type SubmitQuizResponseDTO = {
  id: number | string;
  status: "PENDING";
};

export type QuizCreateProgress =
  | { step: "CREATE_QUIZ" }
  | { step: "ADD_QUESTION"; index: number; total: number }
  | { step: "ADD_ANSWER"; qIndex: number; aIndex: number }
  | { step: "SUBMIT" };

function pickQuestionText(q: any): string {
  return (q?.text ?? q?.question ?? q?.title ?? "").toString().trim();
}

function pickAnswerText(a: any): string {
  return (a?.text ?? a?.answer ?? a?.title ?? "").toString().trim();
}

function pickAnswerCorrect(a: any): boolean {
  // podrži više varijanti iz front modela:
  // isCorrect, is_correct, correct, is_true...
  return !!(a?.isCorrect ?? a?.is_correct ?? a?.correct ?? a?.is_true);
}

function validateDraft(draft: QuizDraft) {
  const questions: any[] = (draft as any)?.questions ?? [];
  if (!Array.isArray(questions) || questions.length < 1) {
    throw new Error("Kviz mora imati bar 1 pitanje.");
  }

  questions.forEach((q, qi) => {
    const text = pickQuestionText(q);
    if (!text) throw new Error(`Pitanje #${qi + 1} nema tekst.`);

    const points = Number(q?.points);
    if (!Number.isFinite(points) || points <= 0) {
      throw new Error(`Pitanje #${qi + 1} mora imati broj bodova > 0.`);
    }

    const answers: any[] = q?.answers ?? [];
    if (!Array.isArray(answers) || answers.length < 2) {
      throw new Error(`Pitanje #${qi + 1} mora imati bar 2 ponuđena odgovora.`);
    }

    const anyCorrect = answers.some(pickAnswerCorrect);
    if (!anyCorrect) {
      throw new Error(`Pitanje #${qi + 1} mora imati bar 1 tačan odgovor.`);
    }

    answers.forEach((a, ai) => {
      const at = pickAnswerText(a);
      if (!at) throw new Error(`Pitanje #${qi + 1}, odgovor #${ai + 1} nema tekst.`);
    });
  });
}

export async function createQuiz(dto: any) {
  return quizHttp.post<CreateQuizResponseDTO>("/api/quizzes", dto);
}

export async function addQuestion(quizId: number | string, dto: CreateQuestionDTO) {
  return quizHttp.post<CreateQuestionResponseDTO>(`/api/quizzes/${quizId}/questions`, dto);
}

export async function addAnswer(questionId: number, dto: CreateAnswerDTO) {
  return quizHttp.post<CreateAnswerResponseDTO>(`/api/questions/${questionId}/answers`, dto);
}

export async function submitQuiz(quizId: number | string) {
  return quizHttp.post<SubmitQuizResponseDTO>(`/api/quizzes/${quizId}/submit`);
}

/**
 * Kreira kviz kompletno + šalje na submit (PENDING).
 * Sekvencijalno je namerno (najmanje edge-caseova).
 */
export async function createAndSubmitFullQuiz(
  draft: QuizDraft,
  onProgress?: (p: QuizCreateProgress) => void
) {
  validateDraft(draft);

  onProgress?.({ step: "CREATE_QUIZ" });
  const dto = mapDraftToCreateQuizDTO(draft);
  const quizRes = await createQuiz(dto);
  const quizId = quizRes.id;

  const questions: any[] = (draft as any).questions;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    onProgress?.({ step: "ADD_QUESTION", index: qi + 1, total: questions.length });

    const qRes = await addQuestion(quizId, {
      text: pickQuestionText(q),
      points: Number(q.points),
    });

    const questionId = qRes.question_id;
    const answers: any[] = q.answers;

    for (let ai = 0; ai < answers.length; ai++) {
      const a = answers[ai];
      onProgress?.({ step: "ADD_ANSWER", qIndex: qi + 1, aIndex: ai + 1 });

      await addAnswer(questionId, {
        text: pickAnswerText(a),
        is_correct: pickAnswerCorrect(a),
      });
    }
  }

  onProgress?.({ step: "SUBMIT" });
  const submitRes = await submitQuiz(quizId);

  return {
    quizId,
    status: submitRes.status, // PENDING
  };
}
