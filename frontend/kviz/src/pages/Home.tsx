export default function Home() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Home</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Privremena početna stranica. Kasnije ovde ide lista dostupnih kvizova (FE-6).
      </p>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 16,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ fontWeight: 700 }}>Brzi linkovi:</div>
        <ul style={{ opacity: 0.8 }}>
          <li>Moderator → Create Quiz</li>
          <li>Admin → Pending Quizzes</li>
        </ul>
      </div>
    </div>
  );
}
