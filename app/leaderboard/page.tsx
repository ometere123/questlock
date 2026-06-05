async function getLeaderboard() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const r = await fetch(`${base}/api/leaderboard`, { cache: "no-store" });
    if (!r.ok) return [];
    const d = await r.json();
    return d.leaderboard ?? [];
  } catch { return []; }
}

interface Row {
  rank: number; wallet_short: string;
  github_login: string | null; discord_username: string | null;
  completed_quests: number; average_score: number | null;
}

export default async function LeaderboardPage() {
  const rows: Row[] = await getLeaderboard();

  return (
    <div className="min-h-screen py-16 px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-sans text-4xl font-bold mb-2" style={{ color: "var(--ql-bighorn)" }}>
          Leaderboard
        </h1>
        <p className="mb-10" style={{ color: "var(--ql-derby)" }}>
          Public, proof-backed. Only completed quests count. No private data exposed.
        </p>

        {rows.length === 0 ? (
          <div className="rounded-[18px] p-10 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="font-sans text-lg mb-2" style={{ color: "var(--ql-bighorn)" }}>No claims yet</p>
            <p className="text-sm mb-4" style={{ color: "var(--ql-derby)" }}>
              Be the first verified builder. Pass a quest and your wallet appears here automatically — no signup, no opt-in.
            </p>
            <a href="/quests" className="inline-block px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: "#834A1F", color: "#F6F1EA" }}>
              Browse open quests →
            </a>
          </div>
        ) : (
          <div className="rounded-[18px] overflow-x-auto"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  {["#", "Builder", "Completed", "Avg score"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider"
                      style={{ color: "var(--ql-bear)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--ql-bear)" }}>{r.rank}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium" style={{ color: "var(--ql-bighorn)" }}>
                        {r.github_login ? `@${r.github_login}` : r.wallet_short}
                      </p>
                      <p className="text-xs font-mono" style={{ color: "var(--ql-bear)" }}>
                        {r.wallet_short}
                        {r.discord_username && <> · discord: {r.discord_username}</>}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--ql-derby)" }}>
                      {r.completed_quests}
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--ql-derby)" }}>
                      {r.average_score !== null ? r.average_score : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
