// src/pages/admin/PendingQuizzes.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quizHttp } from "../../api/http";

type QuizListItemDto = {
  id: string | number;
  title?: string;
  name?: string;

  status?: string; // "PENDING" | "DRAFT" | "APPROVED" ...

  durationSeconds?: number;
  duration_seconds?: number;

  questionsCount?: number;
  questions_count?: number;
  questions?: any[];

  authorName?: string;
  author_name?: string;
  author_id?: number;
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
function getAuthorLabel(q: QuizListItemDto) {
  return q.authorName ?? q.author_name ?? (q.author_id ? `#${q.author_id}` : "Nepoznato");
}

export default function PendingQuizzes() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<QuizListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // admin lista (svi kvizovi)
      const data = await quizHttp.get<QuizListItemDto[]>("/api/quizzes");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg =
        e?.data?.message ||
        e?.data?.error ||
        (typeof e?.data === "string" ? e.data : null) ||
        `Greška pri učitavanju (status: ${e?.status ?? "?"})`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // 👇 ovde podesi šta je "pending" kod vas
  // Ako backend koristi "PENDING" → ostavi ovako.
  // Ako koristi samo "DRAFT" kao "ceka odobrenje" → dodaj i DRAFT u filter.
  const pending = useMemo(() => {
    return rows.filter((q) => {
      const s = (q.status ?? "").toUpperCase();
      return s === "PENDING" || s === "DRAFT"; // prilagodi po potrebi
    });
  }, [rows]);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1>Pending kvizovi</h1>
          <p style={{ opacity: 0.7, marginTop: 6 }}>
            Kvizovi koji čekaju odobrenje administratora.
          </p>
        </div>

        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Učitavam..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="card" style={{ border: "1px solid rgba(222,55,44,.35)", padding: 14, marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Greška</div>
          <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{error}</div>
        </div>
      )}

      {!error && loading && <div style={{ opacity: 0.7, marginTop: 16 }}>Učitavam...</div>}

      {!loading && !error && pending.length === 0 && (
        <div style={{ opacity: 0.7, marginTop: 16 }}>Nema pending kvizova.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {pending.map((q) => (
          <div
            key={String(q.id)}
            className="card"
            onClick={() => navigate(`/admin/pending/${q.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ fontWeight: 700 }}>{getTitle(q)}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
              Autor: {getAuthorLabel(q)} · {getQuestionsCount(q)} pitanja · {getDurationSeconds(q)}s · status:{" "}
              {q.status ?? "?"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
