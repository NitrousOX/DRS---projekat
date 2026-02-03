import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Attempt = {
  quiz_id: number;
  score: number;
  max_score: number;
  correct_count: number;
  total_questions: number;
  time_spent_seconds: number;
  quizTitle?: string;
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
    const raw = localStorage.getItem(`attempt:${attemptId}`);
    return raw ? JSON.parse(raw) : null;
  }, [attemptId]);

  if (!attempt) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Rezultat nije pronađen</h2>
        <button onClick={() => navigate("/quizzes")}>Nazad na listu</button>
      </div>
    );
  }

  const percentage = Math.round((attempt.score / (attempt.max_score || 1)) * 100);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Rezultati Kviza</h1>
      <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 32 }}>{attempt.quizTitle || "Kviz Završen"}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>

        {/* Score Card */}
        <div style={{ background: "rgba(59,130,246,0.1)", padding: 24, borderRadius: 20, border: "1px solid #3b82f6" }}>
          <div style={{ fontSize: 14, textTransform: "uppercase", opacity: 0.7 }}>Ukupno Poena</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#3b82f6" }}>
            {attempt.score} <span style={{ fontSize: 20, opacity: 0.5 }}>/ {attempt.max_score}</span>
          </div>
          <div style={{ marginTop: 8, fontWeight: 600 }}>{percentage}% Tačnost</div>
        </div>

        {/* Stats Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 14, textTransform: "uppercase", opacity: 0.7 }}>Tačna Pitanja</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {attempt.correct_count} <span style={{ fontSize: 18, opacity: 0.5 }}>od {attempt.total_questions}</span>
          </div>
        </div>

        {/* Time Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 14, textTransform: "uppercase", opacity: 0.7 }}>Utrošeno Vreme</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{formatTime(attempt.time_spent_seconds)}</div>
        </div>

      </div>

      <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
        <button
          onClick={() => navigate("/quizzes")}
          style={{ padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}
        >
          Završi i Nazad
        </button>
        <button
          onClick={() => navigate(`/quizzes/${attempt.quiz_id}/leaderboard`)}
          style={{ padding: "12px 24px", borderRadius: 12, background: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          Pogledaj Rang Listu
        </button>
      </div>
    </div>
  );
}
