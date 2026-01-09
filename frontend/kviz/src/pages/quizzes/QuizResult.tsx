import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function QuizResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const attempt = useMemo<Attempt | null>(() => {
    if (!attemptId) return null;
    const raw = localStorage.getItem(`attempt:${attemptId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Attempt;
    } catch {
      return null;
    }
  }, [attemptId]);

  if (!attemptId) return <div style={{ padding: 24 }}>Nedostaje attemptId.</div>;

  if (!attempt) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1>Rezultat</h1>
        <p style={{ opacity: 0.7 }}>Nema rezultata za ovaj attempt.</p>
        <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12 }}>
          Nazad na kvizove
        </button>
      </div>
    );
  }

  // Ako još nije DONE, vodi na processing page
  if (attempt.status !== "DONE") {
    navigate(`/results/${attemptId}`, { replace: true });
    return null;
  }

  const answeredQuestions = Object.values(attempt.answers).filter((a) => a.length > 0).length;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>Rezultat</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>{attempt.quizTitle}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginTop: 18,
        }}
      >
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Bodovi</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{attempt.score ?? 0}</div>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Vreme</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{formatTime(attempt.timeSpentSeconds)}</div>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Odgovoreno</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{answeredQuestions}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12 }}>
          Nazad na kvizove
        </button>

        <button
          onClick={() => navigate(`/quizzes/${attempt.quizId}/leaderboard`)}
          style={{ padding: "10px 14px", borderRadius: 12 }}
        >
          Rang lista
        </button>
      </div>
    </div>
  );
}
