export default function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: "2px solid rgba(255,255,255,0.25)",
        borderTopColor: "rgba(255,255,255,0.9)",
        display: "inline-block",
        animation: "spin 0.9s linear infinite",
      }}
    />
  );
}
