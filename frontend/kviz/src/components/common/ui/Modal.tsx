import { useEffect } from "react";

export default function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props]);

  if (!props.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 9998,
        padding: 18,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(20, 24, 34, 0.96)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
          <div style={{ fontWeight: 900 }}>{props.title}</div>
        </div>

        <div style={{ padding: 16, color: "rgba(255,255,255,0.85)" }}>{props.children}</div>

        {props.footer && (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            {props.footer}
          </div>
        )}
      </div>
    </div>
  );
}
