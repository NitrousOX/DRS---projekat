import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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

function normalize(v: string) {
  return (v ?? "").trim();
}

function extractFilename(v: any): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;

  const noQ = s.split("?")[0].split("#")[0];
  const last = noQ.split("/").filter(Boolean).pop();
  if (!last) return null;

  return last.trim() || null;
}

function getUserImageFilename(u: any): string | null {
  const candidates = [
    u?.image_name,
    u?.profile_image_name,
    u?.avatar_name,
    u?.picture_name,
    u?.photo_name,

    u?.avatar_url,
    u?.avatar,
    u?.profile_image_url,
    u?.profile_image,
    u?.image_url,
    u?.image,
    u?.photo_url,
    u?.photo,
    u?.picture_url,
    u?.picture,
  ];

  for (const c of candidates) {
    const fn = extractFilename(c);
    if (fn) return fn;
  }
  return null;
}

function buildProfileImageUrl(filename: string, cacheBust?: string | number) {
  const safe = encodeURIComponent(filename);
  const v = cacheBust ? `?v=${encodeURIComponent(String(cacheBust))}` : "";
  return `/api/users/profile/image/${safe}${v}`;
}

const PROFILE_ENDPOINT = "/api/users/profile";
const PROFILE_IMAGE_UPLOAD_ENDPOINT = "/api/users/profile/image";
const IMAGE_UPLOAD_FIELD = "file";

// ✅ localStorage key (po user id/email, da ne meša korisnike)
function imageKeyForUser(u: any) {
  const id = u?.id ?? u?.user_id ?? u?.email ?? "me";
  return `profile_image_name__${String(id)}`;
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ✅ local fallback filename (ako backend ne vraća image_name u profilu)
  const [localImageName, setLocalImageName] = useState<string | null>(null);

  // učitaj localStorage kad se user promeni
  useEffect(() => {
    try {
      const key = imageKeyForUser(user);
      const saved = localStorage.getItem(key);
      setLocalImageName(extractFilename(saved));
    } catch {
      setLocalImageName(null);
    }
  }, [user]);

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

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function clearAvatarSelection() {
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onPickAvatar(file: File | null) {
    setErr(null);
    setMsg(null);

    if (!file) {
      clearAvatarSelection();
      return;
    }

    const okMime = ["image/jpeg", "image/png"];
    const name = file.name.toLowerCase();
    const okExt = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");

    if (!okExt || (file.type && !okMime.includes(file.type))) {
      clearAvatarSelection();
      setErr("Dozvoljeni su samo .jpg/.jpeg i .png fajlovi.");
      return;
    }

    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      clearAvatarSelection();
      setErr("Slika je prevelika. Max 5MB.");
      return;
    }

    setAvatarFile(file);
  }

  async function uploadProfileImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append(IMAGE_UPLOAD_FIELD, file, file.name);

    const res = await authHttp.post(PROFILE_IMAGE_UPLOAD_ENDPOINT, fd);
    const data = (res as any)?.data ?? res;

    const raw = data?.image_name ?? data?.filename ?? data?.file_name ?? data?.name;
    const finalName = extractFilename(raw);

    if (!finalName) throw new Error("Upload slike nije vratio image_name/filename.");
    return finalName;
  }

  // ✅ imageName = iz user-a ili iz localStorage fallback-a
  const imageName = useMemo(() => {
    return getUserImageFilename(user) || localImageName;
  }, [user, localImageName]);

  const imageFromFilename = useMemo(() => {
    if (!imageName) return null;
    return buildProfileImageUrl(imageName, avatarVersion);
  }, [imageName, avatarVersion]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);

    try {
      const trimmed: ProfileForm = {
        first_name: normalize(form.first_name),
        last_name: normalize(form.last_name),
        birth_date: normalize(form.birth_date),
        gender: normalize(form.gender),
        country: normalize(form.country),
        street: normalize(form.street),
        street_number: normalize(form.street_number),
      };

      const payload: Record<string, any> = Object.fromEntries(
        Object.entries(trimmed).filter(([k, v]) => {
          if (!v) return false;
          const prev = normalize((initial as any)[k]);
          return v !== prev;
        })
      );

      if (avatarFile) {
        const newImageName = await uploadProfileImage(avatarFile);

        // ⬇️ čak i ako backend ne pamti u profilu, mi ćemo ga lokalno zapamtiti
        try {
          const key = imageKeyForUser(user);
          localStorage.setItem(key, newImageName);
        } catch {}
        setLocalImageName(newImageName);

        // ako backend ipak očekuje da mu pošalješ image_name, šaljemo
        payload.image_name = newImageName;
      }

      if (Object.keys(payload).length === 0) {
        setMsg("Nema izmena za snimanje.");
        return;
      }

      await authHttp.post(PROFILE_ENDPOINT, payload);

      setMsg("Profile updated successfully");
      clearAvatarSelection();
      await refreshProfile();

      setAvatarVersion(Date.now());
    } catch (e: any) {
      setErr(
        `Ne mogu da ažuriram profil. Status=${e?.status ?? "?"}\n` +
          (e?.data
            ? typeof e.data === "string"
              ? e.data
              : JSON.stringify(e.data)
            : e?.message ?? "")
      );
    } finally {
      setBusy(false);
    }
  }

  const avatarToShow = avatarPreview || imageFromFilename;

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h2>Moj profil</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              opacity: 0.9,
            }}
          >
            {avatarToShow ? (
              <img
                src={avatarToShow}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => {
                  // Debug ako treba:
                  // console.log("Image failed:", avatarToShow);
                }}
              />
            ) : (
              "No image"
            )}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Profilna slika</label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
            />

            <div style={{ fontSize: 12, opacity: 0.65 }}>Dozvoljeno: .jpg/.jpeg, .png (max 5MB)</div>
          </div>
        </div>

        <Field label="First name">
          <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
        </Field>

        <Field label="Last name">
          <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
        </Field>

        <Field label="Birth date">
          <input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
        </Field>

        <Field label="Gender">
          <input value={form.gender} onChange={(e) => set("gender", e.target.value)} />
        </Field>

        <Field label="Country">
          <input value={form.country} onChange={(e) => set("country", e.target.value)} />
        </Field>

        <Field label="Street">
          <input value={form.street} onChange={(e) => set("street", e.target.value)} />
        </Field>

        <Field label="Street number">
          <input value={form.street_number} onChange={(e) => set("street_number", e.target.value)} />
        </Field>

        <button type="submit" disabled={busy} style={{ padding: 10, borderRadius: 12 }}>
          {busy ? "Saving..." : "Save changes"}
        </button>

        {msg && <p style={{ color: "lime" }}>{msg}</p>}
        {err && <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{err}</p>}
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
