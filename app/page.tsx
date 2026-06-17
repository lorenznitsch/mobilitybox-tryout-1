export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome Ticket – Deutschlandticket Portal</h1>
      <p>
        Order your Deutschlandticket in 3 simple steps – available in English
        and Arabic.
      </p>
      <a
        href="/order"
        style={{
          display: "inline-block",
          marginTop: "1.5rem",
          padding: "0.85rem 1.5rem",
          background: "#2563eb",
          color: "#fff",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: "1.1rem",
          textDecoration: "none",
        }}
      >
        Order now →
      </a>
    </main>
  );
}
