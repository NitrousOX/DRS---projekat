import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth/AuthContext";
import { useToast } from "../../components/common/toast/ToastProvider";
import Spinner from "../../components/common/ui/Spinner";

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

export default function QuizList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Environment variable for the API
  const API_BASE = import.meta.env.VITE_API_SERVICE_URL || "";

  const [rows, setRows] = useState<QuizListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDelete = user?.role === "ADMIN" || user?.role === "MODERATOR";

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/quizzes`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Niste autorizovani. Ulogujte se ponovo.");
        throw new Error(`Greška: ${response.status}`);
      }

      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!window.confirm("Obrisati kviz?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`${API_BASE}/api/quizzes/${id}`, {
        method: "DELETE", // This triggers the preflight
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Brisanje nije uspelo.");
      }

      toast.success("Kviz obrisan.");
      setRows((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const quizzes = useMemo(() => {
    return rows.filter((q) => (q.status ? q.status === "APPROVED" : true));
  }, [rows]);

  return (
    <div className="page">
      <h1>Dostupni kvizovi</h1>
      {loading && <Spinner size={20} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {quizzes.map((q) => (
          <div key={String(q.id)} className="card" style={{ display: "flex", justifyContent: "space-between", padding: "16px" }}>
            <div>
              <div style={{ fontWeight: 800 }}>{getTitle(q)}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{getDurationSeconds(q)}s</div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn--primary" onClick={() => navigate(`/quizzes/${q.id}/play`)}>
                Start
              </button>

              {canDelete && (
                <button
                  className="btn"
                  style={{ color: "#ff4d4f", border: "1px solid #ff4d4f", background: "none" }}
                  onClick={(e) => handleDelete(e, q.id)}
                  disabled={deletingId === q.id}
                >
                  {deletingId === q.id ? <Spinner size={14} /> : "Obriši"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
