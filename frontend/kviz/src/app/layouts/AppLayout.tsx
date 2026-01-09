import { NavLink, Outlet } from "react-router-dom";



const linkBase: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  fontSize: 13,
  color: "rgba(255,255,255,0.9)",
};

function LinkItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
  to={to}
  style={({ isActive }) => ({
    ...linkBase,
    borderColor: isActive ? "rgba(59,130,246,0.55)" : "rgba(255,255,255,0.12)",
    background: isActive ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)",
  })}
>
  {label}
</NavLink>

  );
}


export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(14px)",
          background: "rgba(11,13,18,0.65)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Q
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800 }}>Kviz platforma</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>DRS 2025/26</div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <LinkItem to="/" label="Home" />
            <LinkItem to="/moderator/create" label="Create Quiz" />
            <LinkItem to="/admin/pending" label="Admin Pending" />
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
