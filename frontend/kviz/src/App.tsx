import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./app/layouts/AppLayout";
import Home from "./pages/Home";
import QuizCreate from "./pages/moderator/QuizCreate";
import PendingQuizzes from "./pages/admin/PendingQuizzes";
import QuizReview from "./pages/admin/QuizReview";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />

        <Route path="/moderator/create" element={<QuizCreate />} />

        <Route path="/admin/pending" element={<PendingQuizzes />} />
        <Route path="/admin/pending/:id" element={<QuizReview />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
