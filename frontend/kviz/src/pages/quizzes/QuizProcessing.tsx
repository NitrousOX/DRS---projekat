import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/common/toast/ToastProvider";

type Attempt = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  durationSeconds: number;
  timeSpentSeconds: number;
  answers: Record<string, string[]>;
  status: "PROCESSING" | "DONE";
  score?: number;
};

export default function QuizProcessing() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    const read = () => {
      const raw = localStorage.getItem(`attempt:${attemptId}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Attempt;
      } catch {
        return null;
      }
    };

    // initial
    setAttempt(read());

    // poll
    const t = window.setInterval(() => {
      const a = read();
      if (!a) return;
      setAttempt(a);
      if (a.status === "DONE") {
        toast.success("Rezultat je spreman.", "Gotovo");
        window.clearInterval(t);
      }
    }, 700);

    return () => window.clearInterval(t);
  }, [attemptId, toast]);

  if (!attemptId) {
    return <div style={{ padding: 24 }}>Nedostaje attemptId.</div>;
  }

  if (!attempt) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1>Rezultat</h1>
        <p style={{ opacity: 0.7 }}>Nema attempt-a u storage-u. Pokreni kviz ponovo.</p>
        <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12 }}>
          Nazad na kvizove
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>Rezultat: {attempt.quizTitle}</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Status: <strong>{attempt.status}</strong>
      </p>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 16,
          padding: 16,
          marginTop: 14,
        }}
      >
        <div>Utrošeno vreme: <strong>{attempt.timeSpentSeconds}s</strong></div>
        {attempt.status === "DONE" && (
          <div style={{ marginTop: 8 }}>
            Bodovi (mock): <strong>{attempt.score ?? 0}</strong>
          </div>
        )}
        {attempt.status === "PROCESSING" && (
          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Obrada traje… (mock polling)
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12 }}>
          Nazad na kvizove
        </button>
      </div>
    </div>
  );
}
