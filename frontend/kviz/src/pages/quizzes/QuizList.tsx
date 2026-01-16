import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quizHttp5001 } from "../../api/http";

type QuizListItemDto = {
  id: string | number;
  title?: string;
  name?: string;
  durationSeconds?: number;
  duration_seconds?: number;
  status?: string;
  questionsCount?: number;
  questions_count?: number;
  questions?: any[];
};

function getTitle(q: QuizListItemDto) {
  return q.title ?? q.name ?? "Bez naziva";
}
function getDurationSeconds(q: QuizListItemDto) {
  return q.durationSeconds ?? q.duration_seconds ?? 0;
}
function getQuestionsCount(q: QuizListItemDto) {
  if (typeof q.questionsCount === "number") return q.questionsCount;
  if (typeof q.questions_count === "number") return q.questions_count;
  if (Array.isArray(q.questions)) return q.questions.length;
  return 0;
}

export default function QuizList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<QuizListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // probaj bez query parametara prvo
        const data = await quizHttp5001.get<QuizListItemDto[]>("/api/quizzes");

        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 401) {
            setError("Nisi ulogovan (cookie nedostaje). Uloguj se ponovo.");
          } else {
            const msg =
              e?.data?.msg ||
              e?.data?.message ||
              e?.data?.error ||
              `Greška pri učitavanju (status: ${e?.status ?? "?"})`;
            setError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const quizzes = useMemo(() => {
    return rows.filter((q) => (q.status ? q.status === "APPROVED" : true));
  }, [rows]);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 8 }}>Dostupni kvizovi</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Lista se učitava sa API-ja (samo APPROVED).
      </p>

      {loading && <div style={{ opacity: 0.7 }}>Učitavam...</div>}

      {!loading && error && (
        <div className="card" style={{ border: "1px solid rgba(222,55,44,.35)", padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Nešto nije ok</div>
          <div style={{ opacity: 0.85 }}>{error}</div>
        </div>
      )}

      {!loading && !error && quizzes.length === 0 && (
        <div style={{ opacity: 0.7 }}>Nema dostupnih kvizova.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {quizzes.map((q) => (
          <div
            key={String(q.id)}
            className="card"
            style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
          >
            <div>
              <div style={{ fontWeight: 800 }}>{getTitle(q)}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                {getQuestionsCount(q)} pitanja · {getDurationSeconds(q)}s
              </div>
            </div>

            <button className="btn btn--primary" onClick={() => navigate(`/quizzes/${q.id}/play`)}>
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
