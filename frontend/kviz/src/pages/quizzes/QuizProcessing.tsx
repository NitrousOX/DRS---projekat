import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/common/toast/ToastProvider";
import { upsertLeaderboardRow } from "../../utils/leaderboardStorage";
import Spinner from "../../components/common/ui/Spinner";
import { getRole } from "../../utils/roleStorage";

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

    setAttempt(read());

    const t = window.setInterval(() => {
      const a = read();
      if (!a) return;
      setAttempt(a);

      if (a.status === "DONE") {
        upsertLeaderboardRow(a.quizId, {
          name: getRole(),
          score: a.score ?? 0,
          timeSpentSeconds: a.timeSpentSeconds,
          createdAt: Date.now(),
        });

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
      <div className="page">
        <h1>Rezultat</h1>
        <p style={{ opacity: 0.7 }}>Nema attempt-a u storage-u. Pokreni kviz ponovo.</p>
        <button className="btn" onClick={() => navigate("/quizzes")}>
          Nazad na kvizove
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 6 }}>Rezultat: {attempt.quizTitle}</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Status: <strong>{attempt.status}</strong>
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <div>
          Utrošeno vreme: <strong>{attempt.timeSpentSeconds}s</strong>
        </div>

        {attempt.status === "DONE" && (
          <div style={{ marginTop: 8 }}>
            Bodovi (mock): <strong>{attempt.score ?? 0}</strong>
          </div>
        )}

        {attempt.status === "PROCESSING" && (
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", opacity: 0.85 }}>
            <Spinner />
            <span>Obrada traje…</span>
          </div>
        )}
      </div>

      {attempt.status === "DONE" && (
        <div style={{ marginTop: 16 }}>
          <button className="btn btn--primary" onClick={() => navigate(`/results/${attemptId}/view`)}>
            Prikaži rezultat
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button className="btn" onClick={() => navigate("/quizzes")}>
          Nazad na kvizove
        </button>
      </div>
    </div>
  );
}
