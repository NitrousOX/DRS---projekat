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
      await login(email.trim(), password);
      nav("/", { replace: true });
    } catch (err: any) {
      // backend: 403 = locked after 3 failed attempts
      if (err?.response?.status === 403) {
        setError(
          err?.response?.data?.message ??
            "Too many failed attempts. Please wait 1 minute and try again."
        );
      } else {
        setError(
          err?.response?.data?.message ??
            err?.response?.data?.detail ??
            err?.message ??
            "Login failed."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Login</h2>

      <form onSubmit={submit}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={busy}>
          {busy ? "..." : "Login"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <p style={{ marginTop: 12 }}>
        Nemaš nalog? <Link to="/register">Registruj se</Link>
      </p>
    </div>
  );
}
