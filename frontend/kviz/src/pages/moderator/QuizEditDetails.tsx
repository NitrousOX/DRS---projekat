import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizHttp } from "../../api/http";
import Spinner from "../../components/common/ui/Spinner";
import { useToast } from "../../components/common/toast/ToastProvider";

export default function QuizEditDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ title: "", description: "", duration_seconds: 60 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        const data = await quizHttp.get<any>(`/api/quizzes/${id}/full`);
        setForm({
          title: data.title,
          description: data.description || "",
          duration_seconds: data.duration_seconds
        });
      } catch (err) {
        toast.error("Greška pri učitavanju osnovnih podataka.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Šaljemo samo osnovne podatke, BEZ 'questions' ključa
      await quizHttp.put(`/api/quizzes/${id}`, form);

      toast.success("Osnovne informacije sačuvane!");
      navigate("/moderator/denied");
    } catch (err) {
      toast.error("Greška pri čuvanju izmena.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Izmeni informacije</h1>
        <p className="text-slate-400">Promenite naziv, opis ili trajanje kviza #{id}.</p>
      </header>

      <form onSubmit={handleSave} className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Naslov Kviza</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Unesite naslov..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Opis</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[140px] text-white"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Kratak opis kviza..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Vreme trajanja (sekunde)</label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
            value={form.duration_seconds}
            onChange={e => setForm({ ...form, duration_seconds: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {saving ? "Čuvanje..." : "Sačuvaj izmene"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/moderator/denied")}
            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all"
          >
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}
