import { useEffect, useState } from "react";
import { authHttp } from "../../api/http";
import type { Role } from "../../utils/roleStorage";

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: string; // ADMIN | MODERATOR | PLAYER
};

type UserUiRow = UserRow & { apiRole: Role };

function normalizeApiRole(roleFromApi: string): Role {
  const r = (roleFromApi ?? "").toUpperCase();
  if (r === "ADMIN") return "ADMIN";
  if (r === "MODERATOR") return "MODERATOR";
  return "PLAYER";
}

function roleLabel(role: Role) {
  return role === "PLAYER" ? "IGRAC" : role;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserUiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const data = await authHttp.get<UserRow[]>("/api/users/");

      if (!Array.isArray(data)) {
        throw new Error("API nije vratio listu (array).");
      }

      setUsers(
        data.map((u) => ({
          ...u,
          apiRole: normalizeApiRole(u.role),
        }))
      );
    } catch (e: any) {
      setUsers([]);
      setError(
        `Greška pri učitavanju korisnika.\nStatus=${e?.status ?? "?"}\n` +
        (e?.data
          ? typeof e.data === "string"
            ? e.data
            : JSON.stringify(e.data)
          : e?.message ?? "")
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(id: number, newRole: Role) {
    setError(null);
    setSavingId(id);

    const prevRole = users.find((u) => u.id === id)?.apiRole ?? "PLAYER";

    setUsers((p) => p.map((u) => (u.id === id ? { ...u, apiRole: newRole } : u)));

    try {
      await authHttp.patch(`/api/users/${id}/role`, { role: newRole });
    } catch (e: any) {
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, apiRole: prevRole } : u)));
      setError(
        `Ne mogu da promenim ulogu.\nStatus=${e?.status ?? "?"}\n` +
        (e?.data
          ? typeof e.data === "string"
            ? e.data
            : JSON.stringify(e.data)
          : e?.message ?? "")
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(id: number, email: string) {
    if (!confirm(`Obrisati korisnika ${email}?`)) return;

    setError(null);
    setDeletingId(id);

    try {
      await authHttp.delete(`/api/users/${id}`);
      setUsers((p) => p.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(
        `Ne mogu da obrišem korisnika.\nStatus=${e?.status ?? "?"}\n` +
        (e?.data
          ? typeof e.data === "string"
            ? e.data
            : JSON.stringify(e.data)
          : e?.message ?? "")
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <h2>Admin – Lista korisnika</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={loadUsers} disabled={loading}>
          {loading ? "Učitavanje..." : "Refresh"}
        </button>
      </div>

      {error && <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</pre>}

      {loading && <p>Učitavanje...</p>}

      {!loading && !error && users.length === 0 && <p>Nema korisnika.</p>}

      {!loading && users.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Ime i prezime</th>
              <th style={th}>Email</th>
              <th style={th}>Uloga</th>
              <th style={th}>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const busy = savingId === u.id || deletingId === u.id;

              return (
                <tr key={u.id}>
                  <td style={td}>{u.id}</td>
                  <td style={td}>{u.full_name}</td>
                  <td style={td}>{u.email}</td>

                  <td style={td}>
                    <select
                      value={u.apiRole}
                      disabled={busy}
                      onChange={(e) => updateRole(u.id, e.target.value as Role)}
                    >
                      <option value="PLAYER">{roleLabel("PLAYER")}</option>
                      <option value="MODERATOR">{roleLabel("MODERATOR")}</option>
                      <option value="ADMIN">{roleLabel("ADMIN")}</option>
                    </select>
                  </td>

                  <td style={td}>
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={busy}
                      className="group relative inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
                    >
                      {deletingId === u.id ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="animate-pulse">Brisanje...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3.5 h-3.5 transition-transform group-hover:-rotate-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Obriši
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid rgba(255,255,255,0.18)",
};

const td: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};
