export type Role = "PLAYER" | "MODERATOR" | "ADMIN";

const KEY = "devRole";

export function getRole(): Role {
  const raw = localStorage.getItem(KEY);
  if (raw === "ADMIN" || raw === "MODERATOR" || raw === "PLAYER") return raw;
  return "PLAYER";
}

export function setRole(role: Role) {
  localStorage.setItem(KEY, role);
}

export function canSee(role: Role, area: "admin" | "moderator" | "player") {
  if (area === "player") return true;
  if (area === "moderator") return role === "MODERATOR" || role === "ADMIN";
  if (area === "admin") return role === "ADMIN";
  return false;
}
