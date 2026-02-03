import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/common/toast/ToastProvider";
import Modal from "../../components/common/ui/Modal";
import Spinner from "../../components/common/ui/Spinner";

type AnswerState = Record<string, string[]>; // questionId -> selected answerIds

interface QuizData {
  id: number;
  title: string;
  duration_seconds: number;
  questions: Array<{
    id: number;
    text: string;
    points: number;
    answers: Array<{ id: number; text: string }>;
  }>;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

export default function QuizPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  const didAutoSubmitRef = useRef(false);
  const dangerTime = timeLeft <= 10 && timeLeft > 0;

  // 1. Fetch Quiz Data using native fetch from your specific endpoint
  useEffect(() => {
    async function fetchQuiz() {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:5000/api/quizzes/${id}/full`);

        if (!response.ok) {
          throw new Error(`Greška: ${response.status}`);
        }

        const data: QuizData = await response.json();
        setQuiz(data);
        setTimeLeft(data.duration_seconds);
        setAnswers({});
        didAutoSubmitRef.current = false;
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Nije moguće učitati kviz sa servera.", "Greška");
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [id, toast]);

  // 2. Timer Logic
  useEffect(() => {
    if (!quiz || submitting || loading) return;

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
  }, [timeLeft, quiz, submitting, loading]);

  const totalQuestions = quiz?.questions.length ?? 0;

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    let c = 0;
    for (const q of quiz.questions) {
      if ((answers[q.id]?.length ?? 0) > 0) c++;
    }
    return c;
  }, [answers, quiz]);

  function toggleAnswer(questionId: string, answerId: string, multi: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multi) {
        const exists = current.includes(answerId);
        const next = exists ? current.filter((x) => x !== answerId) : [...current, answerId];
        return { ...prev, [questionId]: next };
      } else {
        return { ...prev, [questionId]: [answerId] };
      }
    });
  }

  async function submit(auto = false) {
    if (!quiz || submitting) return;
    setSubmitting(true);

    // Format answers for Flask: [{question_id: 1, answer_ids: [1, 2]}, ...]
    const formattedAnswers = Object.entries(answers).map(([qId, aIds]) => ({
      question_id: parseInt(qId),
      answer_ids: aIds.map(id => parseInt(id))
    }));

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/quizzes/${quiz.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1, // Replace with real logged-in user ID
          user_email: "test@example.com",
          time_spent_seconds: Math.max(0, quiz.duration_seconds - timeLeft),
          answers: formattedAnswers
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      const result = await response.json();

      // Save the BACKEND result to localStorage so the results page can show it
      const attemptId = uid();
      localStorage.setItem(`attempt:${attemptId}`, JSON.stringify({
        ...result,
        quizTitle: quiz.title,
        status: "DONE"
      }));

      navigate(`/results/${attemptId}`, { replace: true });
    } catch (err) {
      toast.error("Greška pri komunikaciji sa serverom.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh" }}>
        <Spinner size={40} />
        <p style={{ marginTop: 16 }}>Učitavanje kviza...</p>
      </div>
    );
  }

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
            border: dangerTime ? "1px solid rgba(255,77,79,0.45)" : "1px solid rgba(255,255,255,0.12)",
            background: dangerTime ? "rgba(255,77,79,0.12)" : "rgba(255,255,255,0.04)",
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
          style={{ padding: "10px 14px", borderRadius: 12, background: "#3b82f6", color: "white", border: "none" }}
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
            <button onClick={() => setConfirmExitOpen(false)} style={{ padding: "10px 14px", borderRadius: 12 }}>
              Nastavi
            </button>
            <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12, background: "#ff4d4f", color: "white", border: "none" }}>
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
