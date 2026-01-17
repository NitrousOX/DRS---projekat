import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { authHttp } from "../api/http";
import { useAuth } from "../app/auth/AuthContext";

type ProfileForm = {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  country: string;
  street: string;
  street_number: string;
};

function normalize(v: any) {
  return String(v ?? "").trim();
}

function buildProfileImageUrl(filename: string, cacheBust: number) {
  return `/api/users/profile/image/${encodeURIComponent(filename)}?v=${cacheBust}`;
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const initial = useMemo<ProfileForm>(() => ({
    first_name: normalize(user?.first_name),
    last_name: normalize(user?.last_name),
    birth_date: normalize(user?.birth_date),
    gender: normalize(user?.gender),
    country: normalize(user?.country),
    street: normalize(user?.street),
    street_number: normalize(user?.street_number),
  }), [user]);

  const [form, setForm] = useState<ProfileForm>(initial);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const avatarToShow = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    if (user?.profile_image) {
      return buildProfileImageUrl(user.profile_image, avatarVersion);
    }
    return null;
  }, [avatarPreview, user?.profile_image, avatarVersion]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);

    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        await authHttp.post("/api/users/profile/image", fd);
      }

      const payload = Object.fromEntries(
        Object.entries(form).filter(([k, v]) => normalize(v) !== initial[k as keyof ProfileForm])
      );

      if (Object.keys(payload).length > 0) {
        await authHttp.put("/api/users/profile", payload);
      }

      setMsg("Profil je uspešno sačuvan.");
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await refreshProfile();
      setAvatarVersion(Date.now());
    } catch (e: any) {
      setErr(e?.data?.message || e?.message || "Greška pri čuvanju.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="page" style={{ opacity: 0.7 }}>Učitavam profil...</div>;

  return (
    <div className="page">
      <h1 style={{ marginBottom: 8 }}>Moj Profil</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Upravljaj svojim ličnim podacima i profilnom slikom.
      </p>

      <form onSubmit={submit} style={{ marginTop: 24, display: "grid", gap: 20 }}>

        {/* Slika i Osnovno - Card stil */}
        <div className="card" style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 16,
            background: "rgba(255,255,255,0.05)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0
          }}>
            {avatarToShow ? (
              <img src={avatarToShow} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 12, opacity: 0.5 }}>Bez slike</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 800 }}>Profilna fotografija</div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="btn"
              style={{ fontSize: 12, padding: "6px 10px" }}
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Podaci - Card stil */}
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Ime">
              <input
                className="input"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Field>
            <Field label="Prezime">
              <input
                className="input"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Email adresa (povezana sa nalogom)">
            <input className="input" value={user.email} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Datum rođenja">
              <input
                type="date"
                className="input"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
            </Field>
            <Field label="Pol">
              <input
                className="input"
                placeholder="M / Ž"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {/* Adresa - Card stil */}
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <Field label="Država">
            <input
              className="input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 12 }}>
            <Field label="Ulica">
              <input
                className="input"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </Field>
            <Field label="Broj">
              <input
                className="input"
                value={form.street_number}
                onChange={(e) => setForm({ ...form, street_number: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {/* Statusne poruke */}
        {msg && <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 600 }}>{msg}</div>}
        {err && <div style={{ color: "#f87171", fontSize: 14, fontWeight: 600 }}>{err}</div>}

        <button
          type="submit"
          disabled={busy}
          className="btn btn--primary"
          style={{ padding: 14, fontSize: 16, fontWeight: 800 }}
        >
          {busy ? "Sakupljam podatke..." : "Sačuvaj izmene"}
        </button>
      </form>
    </div>
  );
}

// Pomoćna komponenta za labele
function Field({ label, children }: { label: string; children: any }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
