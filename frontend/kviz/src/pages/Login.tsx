import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.trim()) return "Email is required.";
    if (!email.includes("@")) return "Email format is not valid.";
    if (!password) return "Password is required.";
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setBusy(true);

    try {
      // This calls apiLogin -> authHttp.post, which throws the custom error
      await login(email.trim(), password);
      nav("/", { replace: true });
    } catch (err: any) {
      console.error("Login Error:", err);

      // Your http.ts attaches status directly to the error object
      const status = err?.status;
      // Your http.ts attaches the parsed JSON response to err.data
      const serverMessage = err?.data?.message;

      if (status === 401) {
        setError(serverMessage || "Invalid email or password.");
      } else if (status === 400) {
        setError(serverMessage || "Please check your input.");
      } else if (status === 403) {
        setError(serverMessage || "Account locked.");
      } else {
        // This handles undefined status (network failure) or 500+ errors
        setError("An unexpected error occurred.");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0d12] px-4">
      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-md">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Login</h2>
          <p className="text-white/60 text-sm mt-2">Sign in to continue to your quizzes</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-white/50 uppercase ml-1">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-white/50 uppercase ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {busy ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-white/60 text-sm">
          Nemaš nalog?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 decoration-blue-400/30">
            Registruj se
          </Link>
        </p>
      </div>
    </div>
  );
}
