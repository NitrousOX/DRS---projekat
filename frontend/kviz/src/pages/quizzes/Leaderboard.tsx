import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizzesMock } from "../../mocks/quizzes.mock"; // ovo može ostati dok ne imaš quiz details endpoint

type LeaderboardRow = {
  name: string;
  score: number;
  timeSpentSeconds: number;
};

type LeaderboardResponse = {
  results: LeaderboardRow[];
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Leaderboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const quiz = useMemo(() => quizzesMock.find((q) => q.id === id), [id]);

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);

        const limit = 10;

        // Ako ti treba auth, otkomentariši i prilagodi key
        const token = localStorage.getItem("token"); // npr: "accessToken"
        const res = await fetch(`/api/quizzes/${id}/leaderboard?limit=${limit}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          // pokušaj da izvučeš message iz body-ja
          let msg = `Greška: ${res.status}`;
          try {
            const body = await res.json();
            msg = body?.message || body?.detail || msg;
          } catch {}
          throw new Error(msg);
        }

        const data = (await res.json()) as LeaderboardResponse;
        setRows(Array.isArray(data.results) ? data.results : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Neuspešno učitavanje rang liste.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();

    return () => controller.abort();
  }, [id]);

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
        {loading ? (
          <p style={{ opacity: 0.7, margin: 0 }}>Učitavanje...</p>
        ) : error ? (
          <div style={{ display: "grid", gap: 10 }}>
            <p style={{ opacity: 0.85, margin: 0 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 14px", borderRadius: 12, width: "fit-content" }}
            >
              Pokušaj ponovo
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p style={{ opacity: 0.7, margin: 0 }}>Nema rezultata još.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 1fr 120px 140px",
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
