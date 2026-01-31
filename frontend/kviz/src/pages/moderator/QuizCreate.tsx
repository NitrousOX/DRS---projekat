// src/pages/quizzes/QuizCreate.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import QuizEditor from "../../components/quiz/QuizEditor";
import type { QuizDraft } from "../../types/quiz";
import { mapDraftToCreateQuizDTO } from "../../utils/quizMapper";
import { quizHttp, authHttp } from "../../api/http";

type MeDto = {
  id?: number; // možda ga nema
  role?: string; // "ADMIN" | "MODERATOR" | "PLAYER" (ili "IGRAC")
  email?: string;
};

type CreateQuizResponseDTO = {
  id: number | string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
};

type CreateQuestionResponseDTO = { question_id: number };
type CreateAnswerResponseDTO = { answer_id: number };
type SubmitQuizResponseDTO = { id: number | string; status: "PENDING" };

function normalizeRole(r?: string) {
  const x = (r || "").toUpperCase();
  if (x === "IGRAC") return "PLAYER";
  return x;
}

// --- Helpers za draft polja ---
function qText(q: any): string {
  return (q?.text ?? q?.question ?? q?.title ?? "").toString().trim();
}
function aText(a: any): string {
  return (a?.text ?? a?.answer ?? a?.title ?? "").toString().trim();
}
function aIsCorrect(a: any): boolean {
  return !!(a?.isCorrect ?? a?.is_correct ?? a?.correct ?? a?.is_true);
}

function validateDraft(draft: QuizDraft) {
  const questions: any[] = (draft as any)?.questions ?? [];
  if (!Array.isArray(questions) || questions.length < 1) {
    throw new Error("Kviz mora imati bar 1 pitanje.");
  }

  questions.forEach((q, qi) => {
    const qt = qText(q);
    if (!qt) throw new Error(`Pitanje #${qi + 1} nema tekst.`);

    const points = Number(q?.points);
    if (!Number.isFinite(points) || points <= 0) {
      throw new Error(`Pitanje #${qi + 1} mora imati broj bodova > 0.`);
    }

    const answers: any[] = q?.answers ?? [];
    if (!Array.isArray(answers) || answers.length < 2) {
      throw new Error(`Pitanje #${qi + 1} mora imati bar 2 ponuđena odgovora.`);
    }

    const anyCorrect = answers.some(aIsCorrect);
    if (!anyCorrect) {
      throw new Error(`Pitanje #${qi + 1} mora imati bar 1 tačan odgovor.`);
    }

    answers.forEach((a, ai) => {
      const at = aText(a);
      if (!at) throw new Error(`Pitanje #${qi + 1}, odgovor #${ai + 1} nema tekst.`);
    });
  });
}

export default function QuizCreate() {
  const navigate = useNavigate();

  const [meLoading, setMeLoading] = useState(true);
  const [meRole, setMeRole] = useState<string | null>(null);
  const [meId, setMeId] = useState<number | null>(null); // može ostati null

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setMeLoading(true);
        setError(null);

        const me = await authHttp.get<MeDto>("/api/users/profile");
        const role = normalizeRole(me?.role);

        if (!cancelled) {
          setMeRole(role || null);
          setMeId(me?.id ?? null); // ako backend ne vraća id -> ostaje null i to je OK
        }
      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 401) setError("Nisi ulogovan. Uloguj se ponovo.");
          else {
            setError(
              e?.data?.message ||
                (typeof e?.data === "string" ? e.data : null) ||
                `Ne mogu da učitam profil (status: ${e?.status ?? "?"}).`
            );
          }
        }
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = meRole === "MODERATOR" || meRole === "ADMIN";

  async function handleSubmit(draft: QuizDraft) {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    setProgress(null);

    try {
      if (!canCreate) throw new Error("Nemaš dozvolu. Samo MODERATOR/ADMIN može da kreira kviz.");

      validateDraft(draft);

      // 1) Create quiz
      setProgress("Kreiram kviz...");
      const dto: any = mapDraftToCreateQuizDTO(draft);

      // ✅ author_id šaljemo samo ako ga imamo
      // (ako backend može da ga izvuče iz JWT, ovo je idealno)
      if (meId != null && dto.author_id == null) dto.author_id = meId;

      let quizRes: CreateQuizResponseDTO;
      try {
        quizRes = await quizHttp.post<CreateQuizResponseDTO>("/api/quizzes", dto);
      } catch (e: any) {
        // Ako backend baš zahteva author_id, ovde će se najčešće vratiti 400.
        const backendMsg =
          e?.data?.message ||
          e?.data?.msg ||
          e?.data?.error ||
          (typeof e?.data === "string" ? e.data : "");

        if (
          e?.status === 400 &&
          /author_id/i.test(backendMsg || "") &&
          meId == null
        ) {
          throw new Error(
            'Backend zahteva "author_id", ali /api/users/profile ne vraća id. Reši tako što ćeš:\n' +
              "1) na backendu uzeti author_id iz JWT-a (preporuka), ili\n" +
              "2) proširiti /api/users/profile da vraća id."
          );
        }

        throw e;
      }

      const quizId = quizRes.id;

      // 2) Add questions + answers
      const questions: any[] = (draft as any).questions;

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        setProgress(`Dodajem pitanje ${qi + 1}/${questions.length}...`);

        const qRes = await quizHttp.post<CreateQuestionResponseDTO>(
          `/api/quizzes/${quizId}/questions`,
          { text: qText(q), points: Number(q.points) }
        );

        const questionId = qRes.question_id;
        const answers: any[] = q.answers;

        for (let ai = 0; ai < answers.length; ai++) {
          const a = answers[ai];
          setProgress(`Dodajem odgovore (p${qi + 1}, o${ai + 1}/${answers.length})...`);

          await quizHttp.post<CreateAnswerResponseDTO>(`/api/questions/${questionId}/answers`, {
            text: aText(a),
            is_correct: aIsCorrect(a),
          });
        }
      }

      // 3) Submit quiz -> PENDING
      setProgress("Šaljem kviz na odobrenje (PENDING)...");
      const submitRes = await quizHttp.post<SubmitQuizResponseDTO>(`/api/quizzes/${quizId}/submit`);

      setSuccessMsg(`Kviz kreiran (#${quizId}). Status: ${submitRes.status}`);
    } catch (e: any) {
      if (e?.status === 401) {
        setError('Nisi ulogovan (cookie "access_token" nedostaje). Uloguj se ponovo.');
      } else if (e?.status === 403) {
        setError("Nemaš dozvolu. Samo MODERATOR može da kreira kviz.");
      } else {
        const msg =
          e?.data?.msg ||
          e?.data?.message ||
          e?.data?.error ||
          e?.message ||
          (typeof e?.data === "string" ? e.data : null) ||
          `Greška (status: ${e?.status ?? "?"})`;

        setError(msg);
      }
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>Kreiraj kviz</h1>
          <p style={{ opacity: 0.7, marginTop: 0 }}>
            {meLoading ? "Proveravam dozvole..." : `Uloga: ${meRole ?? "?"}`}
          </p>
        </div>

        <button className="btn" onClick={() => navigate("/quizzes")} disabled={submitting}>
          Nazad
        </button>
      </div>

      {progress && (
        <div
          className="card"
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            padding: 14,
            marginTop: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>U toku</div>
          <div style={{ opacity: 0.9 }}>{progress}</div>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            border: "1px solid rgba(222,55,44,.35)",
            padding: 14,
            marginTop: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Greška</div>
          <div style={{ opacity: 0.9 }}>{error}</div>
        </div>
      )}

      {!meLoading && !error && !canCreate && (
        <div
          className="card"
          style={{
            border: "1px solid rgba(222,55,44,.35)",
            padding: 14,
            marginTop: 14,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Nemaš dozvolu</div>
          <div style={{ opacity: 0.9 }}>Ova stranica je dostupna moderatorima (i adminu).</div>
        </div>
      )}

      {successMsg && (
        <div
          className="card"
          style={{
            border: "1px solid rgba(80,200,120,.25)",
            padding: 14,
            marginTop: 14,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Uspeh</div>
          <div style={{ opacity: 0.9 }}>{successMsg}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button className="btn" onClick={() => navigate("/quizzes")}>
              Nazad na listu
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          opacity: !canCreate ? 0.5 : 1,
          pointerEvents: !canCreate ? "none" : "auto",
        }}
      >
        <QuizEditor
          onSubmit={handleSubmit}
          resetAfterSubmit={!!successMsg}
          // @ts-ignore
          disabled={submitting}
          // @ts-ignore
          submitLabel={submitting ? "Kreiram..." : "Kreiraj kviz"}
        />
      </div>
    </div>
  );
}
