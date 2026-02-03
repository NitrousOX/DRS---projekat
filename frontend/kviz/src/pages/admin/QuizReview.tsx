import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { pendingQuizzesMock } from "../../mocks/pendingQuizzes.mock";
import { useToast } from "../../components/common/toast/ToastProvider";

export default function QuizReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const quiz = pendingQuizzesMock.find((q) => q.id === id);
  const [rejectReason, setRejectReason] = useState("");

  if (!quiz) {
    return <p style={{ padding: 24 }}>Kviz nije pronađen.</p>;
  }

  function approve() {
    toast.success("Kviz je odobren.");
    navigate("/admin/pending");
  }

  function reject() {
    if (!rejectReason.trim()) {
      toast.error("Unesi razlog odbijanja.");
      return;
    }

    toast.info("Kviz je vraćen moderatoru.");
    navigate("/admin/pending");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>{quiz.title}</h1>

      <div style={{ opacity: 0.7, marginBottom: 20 }}>
        Autor: {quiz.authorName} · {quiz.questionsCount} pitanja ·{" "}
        {quiz.duration_seconds}s
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 16,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <h3>Akcije</h3>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={approve}>Approve</button>
          <button onClick={reject}>Reject</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Razlog odbijanja (ako reject)</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ width: "100%", minHeight: 80, marginTop: 6 }}
          />
        </div>
      </div>
    </div>
  );
}
