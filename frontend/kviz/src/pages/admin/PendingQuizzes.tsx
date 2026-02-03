import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { quizHttp } from "../../api/http";

// ================= TYPES =================

type QuizListItemDto = {
  id: string | number;
  title?: string;
  name?: string;
  status?: string;
  duration_seconds?: number;
  questionsCount?: number;
  questions_count?: number;
  questions?: any[];
  authorName?: string;
  author_name?: string;
  author_id?: number;
};

// ================= HELPERS =================

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
function getAuthorLabel(q: QuizListItemDto) {
  return q.authorName ?? q.author_name ?? (q.author_id ? `#${q.author_id}` : "Nepoznato");
}

// ================= COMPONENT =================

export default function PendingQuizzes() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<QuizListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      // Admin ruta koja vraća sve kvizove
      const data = await quizHttp.get<QuizListItemDto[]>("/api/quizzes");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "Greška pri učitavanju.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // --- HANDLERS ---

  async function handleApprove(id: string | number) {
    if (actionId) return;
    try {
      setActionId(id);
      await quizHttp.post(`/api/quizzes/${id}/approve`, {});
      setRows((prev) => prev.filter((q) => q.id !== id));
    } catch (e: any) {
      alert(`Greška: ${e?.data?.error || "Neuspešno odobravanje"}`);
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string | number) {
    if (actionId) return;
    const reason = window.prompt("Razlog odbijanja:");
    if (reason === null) return; // Admin otkazao akciju

    try {
      setActionId(id);
      await quizHttp.post(`/api/quizzes/${id}/reject`, { reason });
      setRows((prev) => prev.filter((q) => q.id !== id));
    } catch (e: any) {
      alert(`Greška: ${e?.data?.error || "Neuspešno odbijanje"}`);
    } finally {
      setActionId(null);
    }
  }

  // Filtriramo samo one koji su "PENDING" ili "DRAFT" za ovu stranicu
  const pending = useMemo(() => {
    return rows.filter((q) => {
      const s = (q.status ?? "").toUpperCase();
      return s === "PENDING" || s === "DRAFT";
    });
  }, [rows]);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 text-white min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Na Čekanju
          </h1>
          <p className="text-white/50 text-sm mt-2 font-medium">
            Pregledaj, odobri ili odbij nove kvizove u sistemu.
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? "Osvežavam..." : "Osveži"}
        </button>
      </header>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Main List */}
      <div className="grid gap-4">
        {loading && pending.length === 0 && (
          <div className="py-20 text-center opacity-40 animate-pulse uppercase tracking-[0.2em] font-black text-sm">
            Skeniranje baze kvizova...
          </div>
        )}

        {!loading && !error && pending.length === 0 && (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center backdrop-blur-sm">
            <div className="text-4xl mb-4 text-white/20">📂</div>
            <h3 className="text-xl font-bold text-white/80">Nema kvizova na čekanju</h3>
            <p className="text-white/40 text-sm mt-2">Svi podneti kvizovi su već obrađeni.</p>
          </div>
        )}

        {pending.map((q) => {
          const isBusy = actionId === q.id;

          return (
            <div
              key={String(q.id)}
              className="group bg-white/5 border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:bg-white/[0.08] backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-black/20"
            >
              {/* Content Info */}
              <div
                className="flex-1 cursor-pointer w-full"
                onClick={() => navigate(`/admin/pending/${q.id}`)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black tracking-tight group-hover:text-blue-400 transition-colors">
                    {getTitle(q)}
                  </h3>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-black text-white/40 border border-white/5">
                    {q.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  <span className="flex items-center gap-1.5 text-blue-400/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    {getAuthorLabel(q)}
                  </span>
                  <span>{getQuestionsCount(q)} Pitanja</span>
                  <span>{getDurationSeconds(q)}s Tajmer</span>
                </div>
              </div>

              {/* Action Group */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  disabled={isBusy}
                  onClick={() => handleApprove(q.id)}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20"
                >
                  {isBusy ? "..." : "Odobri"}
                </button>

                <button
                  disabled={isBusy}
                  onClick={() => handleReject(q.id)}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20"
                >
                  {isBusy ? "..." : "Odbij"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      {!loading && pending.length > 0 && (
        <div className="mt-8 px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex justify-between border-t border-white/5 pt-6">
          <span>Stavki: {pending.length}</span>
          <span>Admin Moderacija</span>
        </div>
      )}
    </div>
  );
}
