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
  answers: Record<string, (string | number)[]>; // questionId -> selected answerIds
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

    const calculateFinalScore = async (currentAttempt: Attempt) => {
      try {
        // 1. Dobavljamo originalni kviz sa servera da proverimo tačne odgovore
        const res = await fetch(`http://127.0.0.1:5000/api/quizzes/${currentAttempt.quizId}/full`);
        if (!res.ok) return 0;
        const quizData = await res.json();

        let totalScore = 0;

        // 2. Prolazimo kroz svako pitanje iz kviza
        quizData.questions.forEach((question: any) => {
          const selectedIds = currentAttempt.answers[question.id] || [];

          // Pronalazimo sve ID-eve koji su označeni kao tačni u bazi
          const correctIds = question.answers
            .filter((a: any) => a.is_correct)
            .map((a: any) => a.id.toString());

          // Pretvaramo selektovane u stringove radi lakšeg poređenja
          const selectedStrIds = selectedIds.map(id => id.toString());

          // Logika za bodovanje:
          // Za single-choice: mora biti tačan ID
          // Za multi-choice: moraju biti izabrani SVI tačni i NIJEDAN netačan
          const isCorrect =
            correctIds.length === selectedStrIds.length &&
            correctIds.every(id => selectedStrIds.includes(id));

          if (isCorrect) {
            totalScore += question.points;
          }
        });

        return totalScore;
      } catch (err) {
        console.error("Greška pri računanju bodova:", err);
        return 0;
      }
    };

    const t = window.setInterval(async () => {
      const a = read();
      if (!a) return;
      setAttempt(a);

      if (a.status === "DONE") {
        window.clearInterval(t); // Odmah zaustavljamo interval

        // Izračunaj bodove pre upisa u leaderboard
        const finalScore = await calculateFinalScore(a);

        // Ažuriraj lokalni storage sa pravim bodovima
        const updatedAttempt = { ...a, score: finalScore };
        localStorage.setItem(`attempt:${attemptId}`, JSON.stringify(updatedAttempt));
        setAttempt(updatedAttempt);

        // Upis u leaderboard
        upsertLeaderboardRow(a.quizId, {
          name: getRole(),
          score: finalScore,
          timeSpentSeconds: a.timeSpentSeconds,
          createdAt: Date.now(),
        });

        toast.success(`Osvojili ste ${finalScore} bodova.`, "Gotovo");
      }
    }, 700);

    return () => window.clearInterval(t);
  }, [attemptId, toast]);

  // --- Render logika ostaje ista ---
  if (!attemptId) return <div style={{ padding: 24 }}>Nedostaje attemptId.</div>;
  if (!attempt) return (
    <div className="page" style={{ padding: 24 }}>
      <h1>Rezultat</h1>
      <p>Učitavanje rezultata...</p>
      <Spinner />
    </div>
  );

  return (
    <div className="page" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 6 }}>Rezultat: {attempt.quizTitle}</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Status: <strong style={{ color: attempt.status === "DONE" ? "#52c41a" : "#1890ff" }}>{attempt.status}</strong>
      </p>

      <div className="card" style={{
        marginTop: 14,
        padding: 20,
        borderRadius: 12,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ fontSize: 18 }}>
          Vreme: <strong>{attempt.timeSpentSeconds}s</strong>
        </div>

        {attempt.status === "DONE" && (
          <div style={{ marginTop: 12, fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
            Ukupno bodova: {attempt.score ?? 0}
          </div>
        )}

        {attempt.status === "PROCESSING" && (
          <div style={{ marginTop: 15, display: "flex", gap: 10, alignItems: "center" }}>
            <Spinner />
            <span>Sistem proverava vaše odgovore…</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        {attempt.status === "DONE" && (
          <button
            className="btn btn--primary"
            style={{ padding: '10px 20px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate(`/results/${attemptId}/view`)}
          >
            Pregledaj odgovore
          </button>
        )}
        <button
          className="btn"
          style={{ padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => navigate("/quizzes")}
        >
          Kraj
        </button>
      </div>
    </div>
  );
}
