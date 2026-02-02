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

  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [country, setCountry] = useState("Serbia");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Common input style to keep code clean
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm";
  const labelClass = "text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1 mb-1 block";

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
      await register(payload);
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.response?.data?.detail ?? e?.message ?? "Register failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0d12] py-12 px-4">
      <div className="w-full max-w-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-md">

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-white/60 text-sm mt-2">Join the community and start quizzing</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Row 1: Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                placeholder="David"
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                placeholder="Poljvas"
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="david@example.com"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                placeholder="Min. 6 chars"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Date & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Birth Date</label>
              <input
                type="date"
                className={`${inputClass} [color-scheme:dark]`}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                className={inputClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as "M" | "F")}
              >
                <option value="M" className="bg-[#1a1c23]">Male</option>
                <option value="F" className="bg-[#1a1c23]">Female</option>
              </select>
            </div>
          </div>

          {/* Row 4: Location */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            <div>
              <label className={labelClass}>Country</label>
              <input
                placeholder="Serbia"
                className={inputClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Street</label>
                <input
                  placeholder="Street name"
                  className={inputClass}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Number</label>
                <input
                  placeholder="12"
                  className={inputClass}
                  value={streetNumber}
                  onChange={(e) => setStreetNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {err && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center font-medium">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4"
          >
            {busy ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-white/60 text-sm">
          Već imaš nalog?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 decoration-blue-400/30 transition-colors">
            Uloguj se
          </Link>
        </p>
      </div>
    </div>
  );
}
