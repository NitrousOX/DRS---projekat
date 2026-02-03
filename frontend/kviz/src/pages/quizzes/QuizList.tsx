import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quizHttp } from "../../api/http"; // ✅ 5001 (service-app)

type QuizListItemDto = {
  id: string | number;
  title?: string;
  name?: string;
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
  return q.duration_seconds ?? 0;
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

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // može i ?include=summary ako backend to podržava
      // const data = await quizHttp.get<QuizListItemDto[]>("/api/quizzes?include=summary");
      const data = await quizHttp.get<QuizListItemDto[]>("/api/quizzes");

      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.status === 401) {
        setError("Nisi ulogovan (cookie nedostaje). Uloguj se ponovo.");
      } else {
        const msg =
          e?.data?.msg ||
          e?.data?.message ||
          e?.data?.error ||
          (typeof e?.data === "string" ? e.data : null) ||
          `Greška pri učitavanju (status: ${e?.status ?? "?"})`;
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) await load();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const quizzes = useMemo(() => {
    // ako backend vraća i druge statuse, filtriraj APPROVED
    return rows.filter((q) => (q.status ? q.status === "APPROVED" : true));
  }, [rows]);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 8 }}>Dostupni kvizovi</h1>

      {loading && <div style={{ opacity: 0.7 }}>Učitavam...</div>}

      {!loading && error && (
        <div className="card" style={{ border: "1px solid rgba(222,55,44,.35)", padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Nešto nije ok</div>
          <div style={{ opacity: 0.85, whiteSpace: "pre-wrap" }}>{error}</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn" onClick={load}>
              Pokušaj opet
            </button>
          </div>
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
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 800 }}>{getTitle(q)}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                {getDurationSeconds(q)}s
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
