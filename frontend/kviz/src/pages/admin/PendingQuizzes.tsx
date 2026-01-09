import { useNavigate } from "react-router-dom";
import { pendingQuizzesMock } from "../../mocks/pendingQuizzes.mock";

export default function PendingQuizzes() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Pending kvizovi</h1>
      <p style={{ opacity: 0.7 }}>
        Kvizovi koji čekaju odobrenje administratora.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {pendingQuizzesMock.map((q) => (
          <div
            key={q.id}
            className="card"
            onClick={() => navigate(`/admin/pending/${q.id}`)}
            style={{ cursor: "pointer" }}
          >

            <div style={{ fontWeight: 600 }}>{q.title}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
              Autor: {q.authorName} · {q.questionsCount} pitanja ·{" "}
              {q.durationSeconds}s
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
