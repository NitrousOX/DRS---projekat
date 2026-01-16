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
      await authHttp.delete(`/api/users/${id}/`);
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
                    <button onClick={() => deleteUser(u.id, u.email)} disabled={busy}>
                      {deletingId === u.id ? "Brisanje..." : "Obriši"}
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
