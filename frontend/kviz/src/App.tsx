import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/auth/AuthContext";
import AppLayout from "./app/layouts/AppLayout";
//import Home from "./pages/Home";

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
        {/* PUBLIC ROUTES (bez auth-a) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* PRIVATE ROUTES */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            {/* ROOT */}
            <Route path="/" element={<Navigate to="/quizzes" replace />} />

            {/* PROFILE */}
            <Route path="/profile" element={<Profile />} />

            {/* QUIZZES */}
            <Route path="/quizzes" element={<QuizList />} />
            <Route path="/quizzes/:id/play" element={<QuizPlay />} />
            <Route path="/results/:attemptId" element={<QuizProcessing />} />
            <Route path="/results/:attemptId/view" element={<QuizResult />} />
            <Route path="/quizzes/:id/leaderboard" element={<Leaderboard />} />

            {/* MODERATOR */}
            <Route path="/moderator/create" element={<QuizCreate />} />

            {/* ADMIN */}
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
