import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { leaderboardMock } from "../../mocks/leaderboard.mock";
import { quizzesMock } from "../../mocks/quizzes.mock";
import { readLeaderboard } from "../../utils/leaderboardStorage";



function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Leaderboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const quiz = useMemo(() => quizzesMock.find((q) => q.id === id), [id]);
  const rows = id ? readLeaderboard(id) : [];

  if (!id || !quiz) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1>Rang lista</h1>
        <p style={{ opacity: 0.7 }}>Kviz nije pronađen.</p>
        <button onClick={() => navigate("/quizzes")} style={{ padding: "10px 14px", borderRadius: 12 }}>
          Nazad
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>Rang lista</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>{quiz.title}</p>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 16,
          padding: 16,
          marginTop: 14,
        }}
      >
        {rows.length === 0 ? (
          <p style={{ opacity: 0.7, margin: 0 }}>Nema rezultata još.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 1fr 120px 120px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontWeight: 900 }}>{i + 1}.</div>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ textAlign: "right", opacity: 0.85 }}>{r.score} pts</div>
                <div style={{ textAlign: "right", opacity: 0.85 }}>{formatTime(r.timeSpentSeconds)}</div>
              </div>
            ))}
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
