import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/auth/AuthContext";
import AppLayout from "./app/layouts/AppLayout";

// Public
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequireAuth from "./app/auth/RequireAuth";

// Profile
import Profile from "./pages/Profile";

// Admin
import UsersAdmin from "./pages/admin/UsersAdmin";
import PendingQuizzes from "./pages/admin/PendingQuizzes";
import QuizReview from "./pages/admin/QuizReview";

// Moderator
import QuizCreate from "./pages/moderator/QuizCreate";

// Quizzes
import QuizList from "./pages/quizzes/QuizList";
import QuizPlay from "./pages/quizzes/QuizPlay";
import QuizProcessing from "./pages/quizzes/QuizProcessing";
import QuizResult from "./pages/quizzes/QuizResult";
import Leaderboard from "./pages/quizzes/Leaderboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* PRIVATE ROUTES */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            {/* ROOT REDIRECT */}
            <Route path="/" element={<Navigate to="/quizzes" replace />} />

            {/* PROFILE */}
            <Route path="/profile" element={<Profile />} />

            {/* QUIZZES & LEADERBOARD */}
            <Route path="/quizzes" element={<QuizList />} />

            {/* Global Leaderboard with Quiz Selection Dropdown */}
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Specific Quiz Leaderboard (optional, if you want direct links) */}
            <Route path="/quizzes/:id/leaderboard" element={<Leaderboard />} />

            {/* QUIZ PLAY FLOW */}
            <Route path="/quizzes/:id/play" element={<QuizPlay />} />
            <Route path="/results/:attemptId" element={<QuizProcessing />} />
            <Route path="/results/:attemptId/view" element={<QuizResult />} />

            {/* MODERATOR ROUTES */}
            <Route path="/moderator/create" element={<QuizCreate />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin/users" element={<UsersAdmin />} />
            <Route path="/admin/pending" element={<PendingQuizzes />} />
            <Route path="/admin/pending/:id" element={<QuizReview />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/quizzes" replace />} />
      </Routes>
    </AuthProvider>
  );
}
