import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/common/toast/ToastProvider";
import Modal from "../../components/common/ui/Modal";
import Spinner from "../../components/common/ui/Spinner";

// Mapping of question_id -> array of selected answer_ids
type AnswerState = Record<number, number[]>;

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

  // 1. Fetch Quiz Data
  useEffect(() => {
    async function fetchQuiz() {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:5000/api/quizzes/${id}/full`);
        if (!response.ok) throw new Error(`Greška: ${response.status}`);

        const data: QuizData = await response.json();
        setQuiz(data);
        setTimeLeft(data.duration_seconds);
        setAnswers({});
        didAutoSubmitRef.current = false;
      } catch (err) {
        toast.error("Nije moguće učitati kviz.", "Greška");
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
        toast.info("Vreme je isteklo — šaljem kviz automatski.", "Vreme isteklo");
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
    return quiz.questions.filter(q => (answers[q.id]?.length ?? 0) > 0).length;
  }, [answers, quiz]);

  // 3. Toggle selection (Multi-choice by default)
  function toggleAnswer(questionId: number, answerId: number) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const exists = current.includes(answerId);
      const next = exists
        ? current.filter((id) => id !== answerId)
        : [...current, answerId];

      return { ...prev, [questionId]: next };
    });
  }

  // 4. Submit to Flask
  async function submit(auto = false) {
    if (!quiz || submitting) return;

    // 1. Check if the user has answered anything
    const hasAnswers = Object.values(answers).some((arr) => arr.length > 0);
    if (!auto && !hasAnswers) {
      toast.error("Označi bar jedan odgovor pre slanja.", "Nema odgovora");
      return;
    }

    setSubmitting(true);

    // 2. Format answers for the Backend mapping
    const formattedAnswers = Object.entries(answers).map(([qId, aIds]) => ({
      question_id: parseInt(qId),
      answer_ids: aIds
    }));

    try {
      // 3. Use the PROXY path (without http://127.0.0.1:5000) 
      // This allows the browser to send cookies automatically.
      const response = await fetch(`/api/quizzes/${quiz.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // IMPORTANT: This tells fetch to include your HttpOnly JWT cookie
        credentials: "include",
        body: JSON.stringify({
          time_spent_seconds: Math.max(0, quiz.duration_seconds - timeLeft),
          answers: formattedAnswers
          // user_id and email are REMOVED - the backend gets them from the JWT
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Server error");
      }

      const result = await response.json();
      const attemptId = uid();

      // 4. Save results to localStorage for the next page
      localStorage.setItem(`attempt:${attemptId}`, JSON.stringify({
        ...result,
        quizTitle: quiz.title,
        status: "DONE"
      }));

      toast.success("Kviz uspešno završen!");
      navigate(`/results/${attemptId}`, { replace: true });

    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Greška pri slanju na server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Spinner size={44} />
        <p style={{ marginTop: 16, opacity: 0.6 }}>Priprema pitanja...</p>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header Sticky Bar logic can be added here if desired */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30, gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 4 }}>{quiz.title}</h1>
          <p style={{ opacity: 0.6 }}>Pitanja: {answeredCount} / {totalQuestions}</p>
        </div>

        <div style={{
          background: dangerTime ? "rgba(255,77,79,0.1)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${dangerTime ? "#ff4d4f" : "rgba(255,255,255,0.1)"}`,
          padding: "12px 20px",
          borderRadius: 16,
          minWidth: 120,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 12, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>Tajmer</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: dangerTime ? "#ff4d4f" : "inherit" }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {quiz.questions.map((q, idx) => (
          <div key={q.id} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 24,
            borderRadius: 20
          }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{idx + 1}. {q.text}</h3>
            <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 20 }}>Bodovi: {q.points}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.answers.map((a) => {
                const selected = (answers[q.id] ?? []).includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAnswer(q.id, a.id)}
                    style={{
                      textAlign: "left",
                      padding: "16px 20px",
                      borderRadius: 14,
                      cursor: "pointer",
                      fontSize: 15,
                      transition: "all 0.2s ease",
                      border: selected ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                      background: selected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
                      color: selected ? "#3b82f6" : "inherit",
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

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 12 }}>
        <button
          onClick={() => setConfirmExitOpen(true)}
          style={{ padding: "14px 24px", borderRadius: 12, background: "transparent", color: "#999", border: "1px solid #333", cursor: "pointer" }}
        >
          Odustani
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 12,
            background: "#3b82f6",
            color: "white",
            border: "none",
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? "Obrada odgovora..." : "Završi kviz"}
        </button>
      </div>

      <Modal open={confirmExitOpen} title="Napusti kviz?" onClose={() => setConfirmExitOpen(false)}>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          Tvoj trenutni rezultat neće biti sačuvan ako napustiš stranicu pre slanja.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/quizzes")}
            style={{ flex: 1, padding: 12, borderRadius: 10, background: "#ff4d4f", color: "white", border: "none", cursor: "pointer" }}
          >
            Napusti
          </button>
          <button
            onClick={() => setConfirmExitOpen(false)}
            style={{ flex: 1, padding: 12, borderRadius: 10, background: "#333", color: "white", border: "none", cursor: "pointer" }}
          >
            Nastavi kviz
          </button>
        </div>
      </Modal>
    </div>
  );
}
