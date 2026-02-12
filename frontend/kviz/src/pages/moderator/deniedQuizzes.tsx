import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/common/toast/ToastProvider";
import Spinner from "../../components/common/ui/Spinner";

export default function DeniedQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const navigate = useNavigate();
  const toast = useToast();
  const API_BASE = import.meta.env.VITE_API_SERVICE_URL || "";

  const loadRejected = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/quizzes/my-rejected`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Nije moguće učitati odbijene kvizove.");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (id: number) => {
    try {
      setSubmittingId(id);
      const res = await fetch(`${API_BASE}/api/quizzes/${id}/submit`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Slanje nije uspelo.");

      toast.success("Kviz je ponovo poslat na odobrenje!");
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  useEffect(() => { loadRejected(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
          Odbijeni kvizovi
        </h1>
        <p className="text-slate-400 text-lg">
          Popravi greške na osnovu komentara administratora i vrati kviz u proces.
        </p>
      </header>

      <div className="space-y-6">
        {quizzes.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-white/5 text-slate-500">
            Prazno. Trenutno nemaš kvizova koji zahtevaju ispravku.
          </div>
        ) : (
          quizzes.map((q) => (
            <div
              key={q.id}
              className="group relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4">{q.title}</h3>

                  {/* Rejection Feedback Box */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">
                      Komentar Administratora
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      "{q.rejection_reason || "Nema specifičnog obrazloženja."}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => navigate(`/moderator/edit/${q.id}`)}
                    className="px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
                  >
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleResubmit(q.id)}
                    disabled={submittingId === q.id}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all text-sm shadow-lg shadow-indigo-500/20"
                  >
                    {submittingId === q.id ? <Spinner size={16} /> : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    Pošalji ponovo
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
