import { useEffect, useState } from "react";
import { authHttp } from "../../api/http";
import type { Role } from "../../utils/roleStorage";

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: string; // backend ti vraća npr. ADMIN ili IGRAC
};

function toApiRole(roleFromApi: string): Role {
  const r = (roleFromApi ?? "").toUpperCase();
  if (r === "ADMIN") return "ADMIN";
  if (r === "MODERATOR") return "MODERATOR";
  if (r === "PLAYER") return "PLAYER";
  if (r === "IGRAC") return "PLAYER";
  return "PLAYER";
}

function labelRole(apiRole: Role) {
  if (apiRole === "PLAYER") return "IGRAC";
  return apiRole;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await authHttp.get<UserRow[]>("/api/users/");
      setUsers(data);
    } catch (e: any) {
      setError(
        `Greška pri učitavanju. Status=${e?.status} ` +
          (e?.data ? `Data=${JSON.stringify(e.data)}` : "")
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(id: number, newRole: Role) {
    setError(null);
    setSavingId(id);

    const prev = users.find((u) => u.id === id)?.role;

    // optimistic update
    setUsers((p) =>
      p.map((u) => (u.id === id ? { ...u, role: labelRole(newRole) } : u))
    );

    try {
      // probaj bez slash pa sa slash
      try {
        await authHttp.patch<{ message: string }>(`/api/users/${id}/role`, {
          role: newRole,
        });
      } catch {
        await authHttp.patch<{ message: string }>(`/api/users/${id}/role/`, {
          role: newRole,
        });
      }
    } catch (e: any) {
      // revert
      if (prev) {
        setUsers((p) => p.map((u) => (u.id === id ? { ...u, role: prev } : u)));
      }
      setError(
        `Ne mogu da promenim ulogu. Status=${e?.status} ` +
          (e?.data ? `Data=${JSON.stringify(e.data)}` : "")
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(id: number, email: string) {
    if (!confirm(`Obrisati korisnika ${email} (ID: ${id})?`)) return;

    setError(null);
    setDeletingId(id);

    try {
      // API: DELETE /api/users/<user_id>
      try {
        await authHttp.delete<{ message: string }>(`/api/users/${id}`);
      } catch {
        // fallback ako backend traži trailing slash
        await authHttp.delete<{ message: string }>(`/api/users/${id}/`);
      }

      // remove locally
      setUsers((p) => p.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(
        `Ne mogu da obrišem korisnika. Status=${e?.status} ` +
          (e?.data ? `Data=${JSON.stringify(e.data)}` : "")
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

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={loadUsers} disabled={loading}>
          {loading ? "Učitavanje..." : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

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
              const apiRole = toApiRole(u.role);
              const busy = savingId === u.id || deletingId === u.id;

              return (
                <tr key={u.id}>
                  <td style={td}>{u.id}</td>
                  <td style={td}>{u.full_name}</td>
                  <td style={td}>{u.email}</td>

                  <td style={td}>
                    <select
                      value={apiRole}
                      disabled={busy}
                      onChange={(e) => updateRole(u.id, e.target.value as Role)}
                    >
                      <option value="PLAYER">IGRAC</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>

                  <td style={td}>
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={busy}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(220,38,38,0.15)",
                        color: "rgba(255,255,255,0.9)",
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      {deletingId === u.id ? "Brisanje..." : "Obriši"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && users.length === 0 && <p>Nema korisnika.</p>}
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
