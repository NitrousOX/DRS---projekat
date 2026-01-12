import React, { useMemo, useState } from "react";
import type { QuizDraft, QuizDraftQuestion } from "../../types/quiz";
import "./quizEditor.css";
import { useToast } from "../common/toast/ToastProvider";



function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function makeEmptyAnswer() {
  return { id: uid(), text: "", isCorrect: false };
}

function makeEmptyQuestion(): QuizDraftQuestion {
  return {
    id: uid(),
    text: "",
    points: 1,
    answers: [makeEmptyAnswer(), makeEmptyAnswer()],
  };
}

function makeEmptyQuiz(): QuizDraft {
  return {
    title: "",
    durationSeconds: 60,
    questions: [makeEmptyQuestion()],
  };
}

type ValidationError = { path: string; message: string };

function validateQuiz(draft: QuizDraft): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!draft.title.trim()) errors.push({ path: "title", message: "Naziv kviza je obavezan." });
  if (!Number.isFinite(draft.durationSeconds) || draft.durationSeconds < 5) {
    errors.push({ path: "durationSeconds", message: "Trajanje mora biti najmanje 5 sekundi." });
  }
  if (draft.questions.length < 1) errors.push({ path: "questions", message: "Dodaj bar jedno pitanje." });

  draft.questions.forEach((q, qi) => {
    if (!q.text.trim()) errors.push({ path: `q.${q.id}.text`, message: `Pitanje #${qi + 1} je prazno.` });
    if (!Number.isFinite(q.points) || q.points < 1) {
      errors.push({ path: `q.${q.id}.points`, message: `Pitanje #${qi + 1}: bodovi moraju biti >= 1.` });
    }
    if (q.answers.length < 2) {
      errors.push({ path: `q.${q.id}.answers`, message: `Pitanje #${qi + 1}: dodaj bar 2 odgovora.` });
    }
    q.answers.forEach((a, ai) => {
      if (!a.text.trim()) errors.push({ path: `a.${a.id}.text`, message: `P#${qi + 1} O#${ai + 1} je prazan.` });
    });
    const correctCount = q.answers.filter((a) => a.isCorrect).length;
    if (correctCount < 1) {
      errors.push({ path: `q.${q.id}.correct`, message: `Pitanje #${qi + 1}: označi bar 1 tačan odgovor.` });
    }
  });

  return errors;
}

export default function QuizEditor(props: {
  initial?: QuizDraft;
  onSubmit: (draft: QuizDraft) => Promise<void> | void;
  resetAfterSubmit?: boolean;
}) {

  const [draft, setDraft] = useState<QuizDraft>(props.initial ?? makeEmptyQuiz());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const errorMap = useMemo(() => {
    const map = new Map<string, string>();
    errors.forEach((e) => {
      if (!map.has(e.path)) map.set(e.path, e.message);
    });
    return map;
  }, [errors]);

  function setTitle(title: string) {
    setDraft((d) => ({ ...d, title }));
  }

  function setDurationSeconds(value: number) {
    setDraft((d) => ({ ...d, durationSeconds: value }));
  }

  function addQuestion() {
    setDraft((d) => ({ ...d, questions: [...d.questions, makeEmptyQuestion()] }));
  }

  function removeQuestion(qid: string) {
    setDraft((d) => {
      const next = d.questions.filter((q) => q.id !== qid);
      return { ...d, questions: next.length ? next : [makeEmptyQuestion()] };
    });
  }

  function updateQuestion(qid: string, patch: Partial<QuizDraftQuestion>) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
    }));
  }

  function addAnswer(qid: string) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id === qid ? { ...q, answers: [...q.answers, makeEmptyAnswer()] } : q
      ),
    }));
  }

  function removeAnswer(qid: string, aid: string) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => {
        if (q.id !== qid) return q;
        const nextAnswers = q.answers.filter((a) => a.id !== aid);
        
        while (nextAnswers.length < 2) nextAnswers.push(makeEmptyAnswer());
        return { ...q, answers: nextAnswers };
      }),
    }));
  }

  function updateAnswer(qid: string, aid: string, patch: { text?: string; isCorrect?: boolean }) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q) => {
        if (q.id !== qid) return q;
        return {
          ...q,
          answers: q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a)),
        };
      }),
    }));
  }

  function resetForm() {
    setDraft(props.initial ?? makeEmptyQuiz());
    setErrors([]);
    setSaved(false);
  }


    async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const v = validateQuiz(draft);
  setErrors(v);
  if (v.length) {
    toast.error("Ispravi označena polja pa pokušaj ponovo.", "Greška u formi");
    return;
  }

  setSubmitting(true);
  try {
    await props.onSubmit(draft);

    toast.success("Kviz je sačuvan.", "Uspeh");

    if (props.resetAfterSubmit) {
      setDraft(makeEmptyQuiz());
      setErrors([]);
    }
  } catch (err: any) {
    console.error(err);

    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Nešto je pošlo po zlu. Pokušaj ponovo.";

    toast.error(msg, "Neuspešno čuvanje");
  } finally {
    setSubmitting(false);
  }
}



    return (
    <form onSubmit={handleSubmit} className="qe-wrap">
      <div className="qe-head">
        <h1 className="qe-title">Kreiraj kviz</h1>
        <p className="qe-sub">Popuni osnovne informacije, pa dodaj pitanja i odgovore.</p>
      </div>

      <div className="qe-card">
        <div className="qe-grid">
          <div>
            <label className="qe-label">Naziv kviza</label>
            <input
              className="qe-input"
              value={draft.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="npr. Opšte znanje #1"
            />
            {errorMap.get("title") && <div className="qe-error">{errorMap.get("title")}</div>}
          </div>

          <div>
            <label className="qe-label">Trajanje (sek)</label>
            <input
              className="qe-input"
              type="number"
              value={draft.durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              min={5}
            />
            {errorMap.get("durationSeconds") && <div className="qe-error">{errorMap.get("durationSeconds")}</div>}
            <div className="qe-smallNote" style={{ marginTop: 8 }}>
              Za testiranje stavite kratko (npr. 30–60s).
            </div>
          </div>
        </div>

        <div className="qe-sectionHead">
          <h2>Pitanja</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="qe-pill">{draft.questions.length} pitanja</span>
            <button type="button" onClick={addQuestion} className="btn">
              + Dodaj pitanje
            </button>
          </div>
        </div>

        <div className="qe-list">
          {draft.questions.map((q, idx) => (
            <div key={q.id} className="qe-qcard">
              <div className="qe-qtop">
                <div>
                  <label className="qe-label">Pitanje #{idx + 1}</label>
                  <input
                    className="qe-input"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    placeholder="Unesi tekst pitanja..."
                  />
                  {errorMap.get(`q.${q.id}.text`) && <div className="qe-error">{errorMap.get(`q.${q.id}.text`)}</div>}
                </div>

                <div>
                  <label className="qe-label">Bodovi</label>
                  <input
                    className="qe-input"
                    type="number"
                    min={1}
                    value={q.points}
                    onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                  />
                  {errorMap.get(`q.${q.id}.points`) && <div className="qe-error">{errorMap.get(`q.${q.id}.points`)}</div>}
                </div>

                <button type="button" onClick={() => removeQuestion(q.id)} className="btn btn--danger">
                  Obriši
                </button>
              </div>

              <div className="qe-answersHead">
                <strong>Odgovori</strong>
                <button type="button" onClick={() => addAnswer(q.id)} className="btn">
                  + Dodaj odgovor
                </button>
                {errorMap.get(`q.${q.id}.correct`) && <span className="qe-inlineErrors">{errorMap.get(`q.${q.id}.correct`)}</span>}
              </div>

              <div className="qe-answers">
                {q.answers.map((a, ai) => (
                  <div key={a.id} className="qe-arow">
                    <input
                      className="qe-check"
                      type="checkbox"
                      checked={a.isCorrect}
                      onChange={(e) => updateAnswer(q.id, a.id, { isCorrect: e.target.checked })}
                      title="Tačan odgovor"
                    />

                    <div>
                      <input
                        className="qe-input"
                        value={a.text}
                        onChange={(e) => updateAnswer(q.id, a.id, { text: e.target.value })}
                        placeholder={`Odgovor #${ai + 1}`}
                      />
                      {errorMap.get(`a.${a.id}.text`) && <div className="qe-error">{errorMap.get(`a.${a.id}.text`)}</div>}
                    </div>

                    <button type="button" onClick={() => removeAnswer(q.id, a.id)} className="btn btn--danger">
                      Obriši
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="qe-actions">
          <button type="submit" disabled={submitting} className="btn btn--primary">
            {submitting ? "Čuvam..." : "Sačuvaj kviz"}
          </button>

          <button type="button" onClick={resetForm} disabled={submitting} className="btn">
            Reset
          </button>

          {errors.length > 0 && (
            <span className="qe-inlineErrors">
              Ima grešaka: {errors.length}. Ispravi označena polja.
            </span>
          )}
        </div>
      </div>
    </form>
  );

}
