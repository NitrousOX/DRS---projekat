import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../../components/common/ui/Spinner";

type Attempt = {
  quiz_id: number;
  score: number;
  max_score: number;
  correct_count: number;
  total_questions: number;
  time_spent_seconds: number;
  quizTitle?: string; // Passed from QuizPlay
};

export default function QuizProcessing() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    // We check localStorage for the result saved by the QuizPlay submit function
    const checkStatus = () => {
      const raw = localStorage.getItem(`attempt:${attemptId}`);
      if (raw) {
        const data = JSON.parse(raw);
        setAttempt(data);

        // If the server response is already there, redirect to the result page after 1.5s
        // This gives the user time to see the "Processing" animation
        setTimeout(() => {
          navigate(`/results/${attemptId}/view`, { replace: true });
        }, 1500);
      }
    };

    const interval = setInterval(checkStatus, 500);
    return () => clearInterval(interval);
  }, [attemptId, navigate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Spinner size={50} />
      <h2 style={{ marginTop: 20 }}>Sistem proverava tvoje odgovore...</h2>
      <p style={{ opacity: 0.6 }}>Ovo može potrajati par sekundi zbog simulacije na serveru.</p>
    </div>
  );
}
