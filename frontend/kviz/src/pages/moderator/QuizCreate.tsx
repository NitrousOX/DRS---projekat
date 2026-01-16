// src/pages/quizzes/QuizCreate.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import QuizEditor from "../../components/quiz/QuizEditor";
import type { QuizDraft } from "../../types/quiz";
import { mapDraftToCreateQuizDTO } from "../../utils/quizMapper";
import { quizHttp, authHttp } from "../../api/http";

type MeDto = {
  id?: number;
  role?: string; // "ADMIN" | "MODERATOR" | "PLAYER" (ili "IGRAC")
  email?: string;
};

type CreateQuizResponseDTO = {
  id: number | string;
  status: string; // "DRAFT"
};

function normalizeRole(r?: string) {
  const x = (r || "").toUpperCase();
  if (x === "IGRAC") return "PLAYER";
  return x;
}

export default function QuizCreate() {
  const navigate = useNavigate();

  const [meLoading, setMeLoading] = useState(true);
  const [meRole, setMeRole] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ✅ role uzimamo sa backend-a, ne iz localStorage
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setMeLoading(true);
        setError(null);

        const me = await authHttp.get<MeDto>("/api/users/profile");
        const role = normalizeRole(me?.role);

        if (!cancelled) setMeRole(role || null);
      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 401) setError("Nisi ulogovan. Uloguj se ponovo.");
          else
            setError(
              e?.data?.message ||
                (typeof e?.data === "string" ? e.data : null) ||
                `Ne mogu da učitam profil (status: ${e?.status ?? "?"}).`
            );
        }
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = meRole === "MODERATOR" || meRole === "ADMIN"; // ako hoćeš i adminu da dozvoliš

  async function handleSubmit(draft: QuizDraft) {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const dto = mapDraftToCreateQuizDTO(draft);

      const res = await quizHttp.post<CreateQuizResponseDTO>(
  "/api/quizzes",   // 👈 bez trailing slash-a
  dto
);




      setSuccessMsg(`Kviz kreiran (#${res.id}). Status: ${res.status}`);
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
          (typeof e?.data === "string" ? e.data : null) ||
          `Greška pri kreiranju (status: ${e?.status ?? "?"})`;

        setError(msg);
      }
    } finally {
      setSubmitting(false);
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
          // ako tvoj QuizEditor nema ova props, ignoriši:
          // @ts-ignore
          disabled={submitting}
          // @ts-ignore
          submitLabel={submitting ? "Kreiram..." : "Kreiraj kviz"}
        />
      </div>
    </div>
  );
}
