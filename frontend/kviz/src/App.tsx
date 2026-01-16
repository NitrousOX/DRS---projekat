import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./app/layouts/AppLayout";
//import Home from "./pages/Home";

import Login from "./pages/Login";
import Register from "./pages/Register";
import RequireAuth from "./app/auth/RequireAuth";

import QuizCreate from "./pages/moderator/QuizCreate";
import PendingQuizzes from "./pages/admin/PendingQuizzes";
import QuizReview from "./pages/admin/QuizReview";
import QuizList from "./pages/quizzes/QuizList";
import QuizPlay from "./pages/quizzes/QuizPlay";
import QuizProcessing from "./pages/quizzes/QuizProcessing";
import QuizResult from "./pages/quizzes/QuizResult";
import Leaderboard from "./pages/quizzes/Leaderboard";




export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* (Opcionalno) ako neko ode na /auth ili slično */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* PRIVATE */}
        <Route element={<RequireAuth />}>
          {/* ROOT redirect */}
          <Route path="/" element={<Navigate to="/quizzes" replace />} />

          {/* Quizzes */}
          <Route path="/quizzes" element={<QuizList />} />
          <Route path="/quizzes/:id/play" element={<QuizPlay />} />
          <Route path="/results/:attemptId" element={<QuizProcessing />} />
          <Route path="/results/:attemptId/view" element={<QuizResult />} />
          <Route path="/quizzes/:id/leaderboard" element={<Leaderboard />} />

          {/* Moderator */}
          <Route path="/moderator/create" element={<QuizCreate />} />

          {/* Admin */}
          <Route path="/admin/pending" element={<PendingQuizzes />} />
          <Route path="/admin/pending/:id" element={<QuizReview />} />
        </Route>

        {/* Fallback (ostaje kako je — RequireAuth će prebaciti na /login ako nije ulogovan) */}
        <Route path="*" element={<Navigate to="/quizzes" replace />} />
      </Route>
    </Routes>
  );
}

