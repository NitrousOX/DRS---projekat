import { useNavigate } from "react-router-dom";
import { quizzesMock } from "../../mocks/quizzes.mock";

export default function QuizList() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 style={{ marginBottom: 8 }}>Dostupni kvizovi</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Ovo je mock lista. Kasnije ide API (samo APPROVED kvizovi).
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {quizzesMock.map((q) => (
          <div
            key={q.id}
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >

            <div>
              <div style={{ fontWeight: 800 }}>{q.title}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                {q.questions.length} pitanja · {q.durationSeconds}s
              </div>
            </div>

            <button
              className="btn btn--primary"
              onClick={() => navigate(`/quizzes/${q.id}/play`)}
            >
              Start
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}
