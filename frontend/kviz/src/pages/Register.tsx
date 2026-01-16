import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../app/auth/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
  const [gender, setGender] = useState<"M" | "F">("M");
  const [country, setCountry] = useState("Serbia");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!email.trim()) return "Email is required.";
    if (!email.includes("@")) return "Email format is not valid.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!birthDate) return "Birth date is required.";
    if (!street.trim()) return "Street is required.";
    if (!streetNumber.trim()) return "Street number is required.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setBusy(true);

    const payload = {
      email: email.trim().toLowerCase(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
      gender,
      country: country.trim(),
      street: street.trim(),
      street_number: streetNumber.trim(),
    };

    try {
      console.log("REGISTER PAYLOAD:", payload);

      // ✅ SAMO JEDNOM
      await register(payload);

      // Pošto AuthContext radi auto-login, idi na home/dashboard
      nav("/", { replace: true });

      // Ako NE želiš auto-login u AuthContext-u, onda umesto ovoga:
      // nav("/login", { replace: true });
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.response?.data?.detail ??
          e?.message ??
          "Register failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Register</h2>

      <form onSubmit={onSubmit}>
        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <input
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as "M" | "F")}
        >
          <option value="M">M</option>
          <option value="F">F</option>
        </select>

        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />

        <input
          placeholder="Street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />

        <input
          placeholder="Street number"
          value={streetNumber}
          onChange={(e) => setStreetNumber(e.target.value)}
        />

        <button disabled={busy} type="submit">
          {busy ? "..." : "Create account"}
        </button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <p style={{ marginTop: 12 }}>
        Već imaš nalog? <Link to="/login">Uloguj se</Link>
      </p>
    </div>
  );
}
