import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./app/layouts/AppLayout";
import Home from "./pages/Home";
import QuizCreate from "./pages/moderator/QuizCreate";
import PendingQuizzes from "./pages/admin/PendingQuizzes";
import QuizReview from "./pages/admin/QuizReview";
import QuizList from "./pages/quizzes/QuizList";
import QuizPlay from "./pages/quizzes/QuizPlay";
import QuizProcessing from "./pages/quizzes/QuizProcessing";



export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* ROOT redirect */}
        <Route path="/" element={<Navigate to="/quizzes" replace />} />

        {/* Quizzes */}
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quizzes/:id/play" element={<QuizPlay />} />
        <Route path="/results/:attemptId" element={<QuizProcessing />} />


        {/* Moderator */}
        <Route path="/moderator/create" element={<QuizCreate />} />

        {/* Admin */}
        <Route path="/admin/pending" element={<PendingQuizzes />} />
        <Route path="/admin/pending/:id" element={<QuizReview />} />



        {/* Fallback */}
        <Route path="*" element={<Navigate to="/quizzes" replace />} />
      </Route>
    </Routes>
  );
}

