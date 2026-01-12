import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizzesMock } from "../../mocks/quizzes.mock";
import { useToast } from "../../components/common/toast/ToastProvider";
import Modal from "../../components/common/ui/Modal";
import Spinner from "../../components/common/ui/Spinner";


type AnswerState = Record<string, string[]>; // questionId -> selected answerIds

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

export default function QuizPlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const quiz = quizzesMock.find((q) => q.id === id);

  const [timeLeft, setTimeLeft] = useState<number>(quiz?.durationSeconds ?? 0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const dangerTime = timeLeft <= 10;



  const didAutoSubmitRef = useRef(false);

  useEffect(() => {
    if (!quiz) return;
    setTimeLeft(quiz.durationSeconds);
    setAnswers({});
    didAutoSubmitRef.current = false;
  }, [quiz?.id]);

  // Timer tick
  useEffect(() => {
    if (!quiz) return;
    if (submitting) return;

    if (timeLeft <= 0) {
      if (!didAutoSubmitRef.current) {
        didAutoSubmitRef.current = true;
        toast.info("Vreme je isteklo — šaljem kviz automatski.", "Auto-submit");
        void submit(true);
      }
      return;
    }

    const t = window.setInterval(() => setTimeLeft((x) => x - 1), 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quiz?.id, submitting]);

  const totalQuestions = quiz?.questions.length ?? 0;

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    let c = 0;
    for (const q of quiz.questions) {
      if ((answers[q.id]?.length ?? 0) > 0) c++;
    }
    return c;
  }, [answers, quiz]);

  if (!quiz) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1>Kviz nije pronađen</h1>
        <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12 }}>
          Nazad na listu
        </button>
      </div>
    );
  }

  function toggleAnswer(questionId: string, answerId: string, multi: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multi) {
        const exists = current.includes(answerId);
        const next = exists ? current.filter((x) => x !== answerId) : [...current, answerId];
        return { ...prev, [questionId]: next };
      } else {
        // single choice
        return { ...prev, [questionId]: [answerId] };
      }
    });
  }

  function validateBeforeSubmit() {
    // Minimalno: dozvoljavamo submit i bez svih odgovora.
    // Ali bar 1 odgovor je lep check.
    const any = Object.values(answers).some((arr) => arr.length > 0);
    if (!any) {
      toast.error("Označi bar jedan odgovor pre slanja.", "Nema odgovora");
      return false;
    }
    return true;
  }

  async function submit(auto = false) {
  if (!quiz) return; // ✅ TypeScript guard
  if (submitting) return;
  if (!auto && !validateBeforeSubmit()) return;

  setSubmitting(true);

  const attemptId = uid();
  const startedAt = Date.now();

  const payload = {
    attemptId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    durationSeconds: quiz.durationSeconds,
    timeSpentSeconds: Math.max(0, quiz.durationSeconds - timeLeft),
    answers,
    startedAt,
    status: "PROCESSING" as const,
  };

  localStorage.setItem(`attempt:${attemptId}`, JSON.stringify(payload));

  // mock async processing
  const delay = 3000 + Math.floor(Math.random() * 3000);
  window.setTimeout(() => {
    const done = {
      ...payload,
      status: "DONE" as const,
      score: answeredCount * 10,
    };
    localStorage.setItem(`attempt:${attemptId}`, JSON.stringify(done));
  }, delay);

  toast.success("Odgovori poslati. Obrada je u toku.", "Poslato");
  navigate(`/results/${attemptId}`, { replace: true });
}


  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{quiz.title}</h1>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Odgovoreno: {answeredCount}/{totalQuestions}
          </div>
        </div>

        <div
  style={{
    border: dangerTime
      ? "1px solid rgba(255,77,79,0.45)"
      : "1px solid rgba(255,255,255,0.12)",
    background: dangerTime
      ? "rgba(255,77,79,0.12)"
      : "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: "10px 12px",
    minWidth: 140,
    textAlign: "right",
  }}
>
  <div style={{ fontSize: 12, opacity: 0.7 }}>Preostalo</div>
  <div style={{ fontSize: 20, fontWeight: 800 }}>
    {formatTime(timeLeft)}
  </div>
</div>

      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
        {quiz.questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>
              {idx + 1}. {q.text}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
              Bodovi: {q.points} · {q.multi ? "Više tačnih" : "Jedan tačan"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.answers.map((a) => {
                const selected = (answers[q.id] ?? []).includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAnswer(q.id, a.id, q.multi)}
                    style={{
                      textAlign: "left",
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: selected ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  >
                    {a.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setConfirmExitOpen(true)}

          disabled={submitting}
          style={{ padding: "10px 14px", borderRadius: 12 }}
        >
          Odustani
        </button>

        <button
        type="button"
        onClick={() => submit(false)}
        disabled={submitting}
        style={{ padding: "10px 14px", borderRadius: 12 }}
        >
        {submitting ? (
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <Spinner size={16} />
            Šaljem...
            </span>
        ) : (
            "Submit"
        )}
        </button>

      </div>
      <Modal
        open={confirmExitOpen}
        title="Napusti kviz?"
        onClose={() => setConfirmExitOpen(false)}
        footer={
            <>
            <button
                onClick={() => setConfirmExitOpen(false)}
                style={{ padding: "10px 14px", borderRadius: 12 }}
            >
                Nastavi
            </button>
            <button
                onClick={() => navigate("/quizzes")}
                style={{ padding: "10px 14px", borderRadius: 12 }}
            >
                Napusti
            </button>
            </>
        }
        >
        Imaš neposlate odgovore. Ako napustiš kviz, izgubićeš trenutni pokušaj.
        </Modal>

    </div>
  );
}
