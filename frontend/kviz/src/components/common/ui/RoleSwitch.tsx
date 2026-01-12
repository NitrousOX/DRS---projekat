import { useEffect, useState } from "react";
import { getRole, setRole, type Role } from "../../../utils/roleStorage";

export default function RoleSwitch() {
  const [role, setRoleState] = useState<Role>(getRole());

  useEffect(() => {
    const onStorage = () => setRoleState(getRole());
    const onDev = () => setRoleState(getRole());
    window.addEventListener("storage", onStorage);
    window.addEventListener("devRoleChanged", onDev as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("devRoleChanged", onDev as EventListener);
    };
  }, []);

  function change(next: Role) {
    setRole(next);
    setRoleState(next);
    window.dispatchEvent(new Event("devRoleChanged"));
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>DEV role:</span>
      <select
        value={role}
        onChange={(e) => change(e.target.value as Role)}
        style={{
          padding: "9px 10px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.92)",
          outline: "none",
        }}
      >
        <option value="PLAYER">PLAYER</option>
        <option value="MODERATOR">MODERATOR</option>
        <option value="ADMIN">ADMIN</option>
      </select>
    </div>
  );
}
