import { useEffect, useMemo, useState, type FormEvent } from "react";
import { authHttp } from "../api/http";
import { useAuth } from "../app/auth/AuthContext";

type ProfileForm = {
  first_name: string;
  last_name: string;
  birth_date: string; // YYYY-MM-DD
  gender: string;
  country: string;
  street: string;
  street_number: string;
};

function pickStr(v: any) {
  return typeof v === "string" ? v : "";
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const initial = useMemo<ProfileForm>(
    () => ({
      first_name: pickStr((user as any)?.first_name),
      last_name: pickStr((user as any)?.last_name),
      birth_date: pickStr((user as any)?.birth_date),
      gender: pickStr((user as any)?.gender),
      country: pickStr((user as any)?.country),
      street: pickStr((user as any)?.street),
      street_number: pickStr((user as any)?.street_number),
    }),
    [user]
  );

  const [form, setForm] = useState<ProfileForm>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // kad user stigne/refreshuje se, popuni formu
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);

    try {
      // šaljemo samo polja koja user menja (email/role/id backend ignoriše)
      await authHttp.put<{ message: string }>("/api/users/profile", form);

      setMsg("Profile updated successfully");
      await refreshProfile();
    } catch (e: any) {
      setErr(e?.data?.message ?? "Ne mogu da ažuriram profil.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h2>Moj profil</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <Field label="First name">
          <input
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            placeholder="First name"
          />
        </Field>

        <Field label="Last name">
          <input
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            placeholder="Last name"
          />
        </Field>

        <Field label="Birth date">
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => set("birth_date", e.target.value)}
          />
        </Field>

        <Field label="Gender">
          <input
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            placeholder="Gender"
          />
        </Field>

        <Field label="Country">
          <input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="Country"
          />
        </Field>

        <Field label="Street">
          <input
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            placeholder="Street"
          />
        </Field>

        <Field label="Street number">
          <input
            value={form.street_number}
            onChange={(e) => set("street_number", e.target.value)}
            placeholder="Street number"
          />
        </Field>

        <button type="submit" disabled={busy} style={{ padding: 10, borderRadius: 12 }}>
          {busy ? "Saving..." : "Save changes"}
        </button>

        {msg && <p style={{ color: "lime" }}>{msg}</p>}
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
      {children}
    </label>
  );
}
