import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/common/toast/ToastProvider";
import Modal from "../../components/common/ui/Modal";
import Spinner from "../../components/common/ui/Spinner";

// --- TYPES ---

type AnswerState = Record<number, number[]>;

interface QuizData {
  id: number;
  title: string;
  duration_seconds: number;
  questions: Array<{
    id: number;
    text: string;
    points: number;
    answers: Array<{ id: number; text: string }>;
  }>;
}

// --- HELPERS ---

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

// --- COMPONENT ---

export default function QuizPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Environment variable for the API
  const API_BASE = import.meta.env.VITE_API_SERVICE_URL || "";

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);

  const didAutoSubmitRef = useRef(false);
  const dangerTime = timeLeft <= 10 && timeLeft > 0;

  // 1. Fetch Quiz Data
  useEffect(() => {
    async function fetchQuiz() {
      if (!id) return;
      try {
        setLoading(true);

        // Using explicit VITE_API_SERVICE_URL
        const response = await fetch(`${API_BASE}/api/quizzes/${id}/full`, {
          credentials: "include"
        });

        if (!response.ok) throw new Error(`Greška: ${response.status}`);

        const data: QuizData = await response.json();
        setQuiz(data);
        setTimeLeft(data.duration_seconds);
        setAnswers({});
        didAutoSubmitRef.current = false;
      } catch (err: any) {
        console.error("Fetch error:", err);
        toast.error("Nije moguće učitati kviz.", "Greška");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id, toast, API_BASE]);

  // 2. Submit Logic
  const submit = async (auto = false) => {
    if (!quiz || submitting) return;

    const hasAnswers = Object.values(answers).some((arr) => arr.length > 0);
    if (!auto && !hasAnswers) {
      toast.error("Označi bar jedan odgovor pre slanja.", "Nema odgovora");
      return;
    }

    setSubmitting(true);

    const formattedAnswers = Object.entries(answers).map(([qId, aIds]) => ({
      question_id: parseInt(qId),
      answer_ids: aIds
    }));

    try {
      // Using explicit VITE_API_SERVICE_URL
      const response = await fetch(`${API_BASE}/api/quizzes/${quiz.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          time_spent_seconds: Math.max(0, quiz.duration_seconds - timeLeft),
          answers: formattedAnswers
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.msg || "Server error");
      }

      const result = await response.json();
      const attemptId = uid();

      localStorage.setItem(`attempt:${attemptId}`, JSON.stringify({
        ...result,
        quizTitle: quiz.title,
        status: "DONE"
      }));

      toast.success("Kviz uspešno završen!");
      navigate(`/results/${attemptId}`, { replace: true });

    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Greška pri slanju na server.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Timer Logic
  useEffect(() => {
    if (!quiz || submitting || loading) return;

    if (timeLeft <= 0) {
      if (!didAutoSubmitRef.current) {
        didAutoSubmitRef.current = true;
        toast.info("Vreme je isteklo — šaljem kviz automatski.", "Vreme isteklo");
        submit(true);
      }
      return;
    }

    const t = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, quiz, submitting, loading, toast]);

  const totalQuestions = quiz?.questions.length ?? 0;
  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.filter(q => (answers[q.id]?.length ?? 0) > 0).length;
  }, [answers, quiz]);

  function toggleAnswer(questionId: number, answerId: number) {
    setAnswers((prev) => {
      const currentSelected = prev[questionId] ?? [];
      const isAlreadySelected = currentSelected.includes(answerId);

      let nextSelected: number[];

      if (isAlreadySelected) {
        // Ako je već izabran, ukloni ga (unselect)
        nextSelected = currentSelected.filter((id) => id !== answerId);
      } else {
        // Ako nije izabran, dodaj ga u niz (multiple choice)
        nextSelected = [...currentSelected, answerId];
      }

      return { ...prev, [questionId]: nextSelected };
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Spinner size={44} />
        <p className="mt-4 opacity-60">Priprema pitanja...</p>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div className="flex justify-between items-end mb-8 gap-5">
        <div>
          <h1 className="text-3xl font-bold mb-1">{quiz.title}</h1>
          <p className="opacity-60 text-sm font-medium tracking-wide">
            Pitanja: {answeredCount} / {totalQuestions}
          </p>
        </div>

        <div className={`
          ${dangerTime ? "bg-red-500/10 border-red-500" : "bg-white/5 border-white/10"}
          border px-5 py-3 rounded-2xl min-w-[120px] text-center transition-colors
        `}>
          <div className="text-[10px] opacity-50 uppercase tracking-widest mb-1 font-bold">Tajmer</div>
          <div className={`text-2xl font-black ${dangerTime ? "text-red-500" : "text-white"}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white/[0.02] border border-white/[0.08] p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-2">{idx + 1}. {q.text}</h3>
            <p className="text-xs opacity-50 mb-5 font-black uppercase tracking-wider">Bodovi: {q.points}</p>

            <div className="flex flex-col gap-3">
              {q.answers.map((a) => {
                const selected = (answers[q.id] ?? []).includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAnswer(q.id, a.id)}
                    className={`
                      text-left px-5 py-4 rounded-2xl cursor-pointer text-[15px] transition-all duration-200 border-2
                      ${selected
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-white/5 bg-white/5 hover:bg-white/10 text-white/80"}
                    `}
                  >
                    {a.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 py-6 border-t border-white/10 flex gap-3">
        <button
          onClick={() => setConfirmExitOpen(true)}
          className="px-6 py-4 rounded-xl bg-transparent text-white/40 border border-white/10 font-bold hover:bg-white/5 transition-colors cursor-pointer"
        >
          Odustani
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting}
          className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest shadow-lg shadow-blue-900/20"
        >
          {submitting ? "Obrada odgovora..." : "Završi kviz"}
        </button>
      </div>

      <Modal open={confirmExitOpen} title="Napusti kviz?" onClose={() => setConfirmExitOpen(false)}>
        <p className="opacity-70 mb-6 leading-relaxed">
          Tvoj trenutni rezultat neće biti sačuvan ako napustiš stranicu pre slanja.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/quizzes")}
            className="flex-1 p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors cursor-pointer"
          >
            Napusti
          </button>
          <button
            onClick={() => setConfirmExitOpen(false)}
            className="flex-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
          >
            Nastavi kviz
          </button>
        </div>
      </Modal>
    </div>
  );
}
