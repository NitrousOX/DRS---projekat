// src/utils/roleStorage.ts

export type Role = "PLAYER" | "MODERATOR" | "ADMIN";

/**
 * DEV role storage (za stare delove koda koji još uvoze getRole/setRole).
 * Ako više ne koristiš dev role switch, možeš kasnije obrisati ove dve funkcije
 * i zameniti ih svuda sa useAuth().role.
 */
const KEY = "devRole";

export function getRole(): Role {
  const raw = localStorage.getItem(KEY);
  if (raw === "ADMIN" || raw === "MODERATOR" || raw === "PLAYER") return raw;
  return "PLAYER";
}

export function setRole(role: Role) {
  localStorage.setItem(KEY, role);
}

/**
 * canSee:
 * - PLAYER vidi player
 * - MODERATOR vidi player + moderator
 * - ADMIN vidi sve
 */
export function canSee(role: Role, area: "player" | "moderator" | "admin"): boolean {
  if (area === "player") return true;
  if (area === "moderator") return role === "MODERATOR" || role === "ADMIN";
  if (area === "admin") return role === "ADMIN";
  return false;
}

/**
 * Mapiranje backend role stringa u frontend Role.
 * (koristi se u AuthContext-u)
 */
export function normalizeRole(value: unknown): Role | null {
  if (value === "ADMIN" || value === "admin") return "ADMIN";
  if (value === "MODERATOR" || value === "moderator") return "MODERATOR";

  // backend nekad vraća "user" ili "player"
  if (
    value === "PLAYER" ||
    value === "player" ||
    value === "USER" ||
    value === "user"
  ) {
    return "PLAYER";
  }

  return null;
}
