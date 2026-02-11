import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizHttp } from "../../api/http";
import Spinner from "../../components/common/ui/Spinner";
import { useAuth } from "../../app/auth/AuthContext";
import { useToast } from "../../components/common/toast/ToastProvider";

interface QuizSummary {
  id: number;
  title: string;
  status: string;
}

interface LeaderboardEntry {
  result_id: number;
  user_email: string;
  score: number;
  time_spent_seconds: number;
  completed_at: string;
}

interface LeaderboardResponse {
  quiz_id: number;
  results: LeaderboardEntry[];
}

export default function Leaderboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Derive Admin status
  const isAdmin = user?.role === "ADMIN";

  // 1. Fetch available quizzes
  useEffect(() => {
    async function loadQuizzes() {
      try {
        setLoadingQuizzes(true);
        const data = await quizHttp.get<QuizSummary[]>("/api/quizzes");
        const approved = data.filter((q) => q.status === "APPROVED");
        setQuizzes(approved);

        if (id) {
          setSelectedQuizId(Number(id));
        } else if (approved.length > 0 && !selectedQuizId) {
          setSelectedQuizId(approved[0].id);
        }
      } catch (err) {
        console.error("Failed to load quizzes", err);
        toast.error("Nije moguće učitati listu kvizova.");
      } finally {
        setLoadingQuizzes(false);
      }
    }
    loadQuizzes();
  }, [id, toast]);

  // 2. Fetch leaderboard data when selection changes
  useEffect(() => {
    if (!selectedQuizId) return;

    async function loadLeaderboard() {
      setLoadingTable(true);
      try {
        const data = await quizHttp.get<LeaderboardResponse>(
          `/api/quizzes/${selectedQuizId}/leaderboard`
        );
        setLeaderboard(data.results);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoadingTable(false);
      }
    }
    loadLeaderboard();
  }, [selectedQuizId]);

  // 3. Admin Report Handler
  const handleSendReport = async () => {
    if (!selectedQuizId) return;
    setReporting(true);
    try {
      await quizHttp.post(`/api/quizzes/${selectedQuizId}/send-report`, {});
      toast.success("PDF izveštaj je uspešno poslat na Vaš email!");
    } catch (err: any) {
      console.error("Report error:", err);
      toast.error("Greška pri generisanju PDF izveštaja.");
    } finally {
      setReporting(false);
    }
  };

  const handleQuizChange = (newId: number) => {
    setSelectedQuizId(newId);
    navigate(`/quizzes/${newId}/leaderboard`, { replace: true });
  };

  if (loadingQuizzes) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Rang Lista
          </h1>
          <p className="text-slate-400">Najbolji rezultati naših korisnika</p>
        </header>

        {/* --- Selector & Admin Action Row --- */}
        <div className="mb-10 flex flex-col md:flex-row items-end justify-center gap-4">
          <div className="relative w-full max-w-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 ml-1">
              Izaberi Kviz
            </label>
            <select
              value={selectedQuizId ?? ""}
              onChange={(e) => handleQuizChange(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer shadow-lg"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id} className="bg-slate-900 text-white">
                  {q.title}
                </option>
              ))}
            </select>
            <div className="absolute bottom-5 right-5 pointer-events-none opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </div>
          </div>

          {/* Admin Report Button */}
          {isAdmin && (
            <button
              onClick={handleSendReport}
              disabled={reporting || !selectedQuizId}
              className={`h-[60px] flex items-center gap-3 px-8 rounded-2xl font-bold transition-all shadow-xl active:scale-95 whitespace-nowrap
                ${reporting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30'}`}
            >
              {reporting ? <Spinner size={20} /> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {reporting ? "Generisanje..." : "Generiši PDF"}
            </button>
          )}
        </div>

        {/* --- Leaderboard Table Container --- */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
          {loadingTable ? (
            <div className="p-32 flex flex-col items-center justify-center">
              <Spinner size={32} />
              <span className="mt-4 text-slate-500 animate-pulse">Učitavanje rezultata...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-sm uppercase tracking-widest">
                    <th className="px-8 py-5 font-bold">Pozicija</th>
                    <th className="px-8 py-5 font-bold">Korisnik</th>
                    <th className="px-8 py-5 font-bold text-center">Poeni</th>
                    <th className="px-8 py-5 font-bold text-center">Vreme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => (
                      <tr
                        key={entry.result_id}
                        className="hover:bg-white/[0.07] transition-all duration-200 group"
                      >
                        <td className="px-8 py-5">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-black shadow-inner 
                            ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 scale-110' :
                              index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900' :
                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-orange-950' :
                                  'bg-white/5 text-slate-400'}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-8 py-5 font-semibold text-slate-200 group-hover:text-white">
                          {entry.user_email}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-xl font-bold text-blue-400">
                            {entry.score}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center text-slate-400 font-mono">
                          {entry.time_spent_seconds}s
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <p className="text-xl">Još uvek nema rezultata</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
