import Link from "next/link";

export default function LandingPage() {
  const HOW_IT_WORKS = [
    {
      step: "01",
      title: "Connect wallet",
      desc: "Connect via Privy on Base Sepolia. No gas required to get started.",
    },
    {
      step: "02",
      title: "Submit GitHub proof",
      desc: "Provide your GitHub username, repository URL and demo link.",
    },
    {
      step: "03",
      title: "Objective checks run",
      desc: "The proof engine checks commits, README, files, demo URL and anti-farm rules.",
    },
    {
      step: "04",
      title: "Attestation issued",
      desc: "Passed submissions receive a public EAS attestation on Base Sepolia.",
    },
    {
      step: "05",
      title: "Claim reward gaslessly",
      desc: "Gelato Relay submits the claim transaction. No ETH needed.",
    },
    {
      step: "06",
      title: "Receive token + badge",
      desc: "QUEST tokens transfer and a soulbound ERC-1155 badge mints to your wallet.",
    },
  ];

  const PROOF_CHECKS = [
    { label: "Repository exists and is public", pts: 10 },
    { label: "Owner matches submitted GitHub username", pts: 10 },
    { label: "Updated after quest start", pts: 10 },
    { label: "3+ commits after quest start", pts: 15 },
    { label: "README file present", pts: 10 },
    { label: "README 500+ characters", pts: 10 },
    { label: "Frontend files detected", pts: 10 },
    { label: "Contract/backend files detected", pts: 10 },
    { label: "Demo URL loads", pts: 10 },
    { label: "Not previously submitted", pts: 5 },
  ];

  return (
    <div>
      {/* Hero */}
      <section
        style={{ background: "var(--ql-bighorn)" }}
        className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-24"
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8"
            style={{ background: "#834A1F", color: "#F6F1EA" }}
          >
            Base Sepolia · Proof-Powered
          </div>
          <h1
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: "#F6F1EA" }}
          >
            Rewards should follow proof, not farming.
          </h1>
          <p
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: "var(--ql-cafe)" }}
          >
            QuestLock is a deterministic proof platform. Submit your GitHub
            project, pass objective checks, receive a public attestation, claim
            rewards gaslessly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/quests"
              className="px-8 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90"
              style={{ background: "#834A1F", color: "#F6F1EA" }}
            >
              Browse Quests
            </Link>
            <Link
              href="/admin"
              className="px-8 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#F6F1EA",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              Create Quest
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="py-24 px-6"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-serif text-3xl md:text-4xl font-bold text-center mb-3"
            style={{ color: "var(--ql-bighorn)" }}
          >
            How it works
          </h2>
          <p
            className="text-center text-base mb-14 max-w-lg mx-auto"
            style={{ color: "var(--ql-derby)" }}
          >
            Every step is transparent. No subjective scoring. No AI.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-[18px] p-6"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-xs font-bold mb-3"
                  style={{ color: "var(--ql-chocolate)" }}
                >
                  {step}
                </div>
                <h3
                  className="font-serif text-lg font-semibold mb-2"
                  style={{ color: "var(--ql-bighorn)" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ql-derby)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof checks */}
      <section
        className="py-24 px-6"
        style={{ background: "var(--ql-night)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-serif text-3xl md:text-4xl font-bold text-center mb-3"
            style={{ color: "#F6F1EA" }}
          >
            Objective proof checks
          </h2>
          <p
            className="text-center text-base mb-12"
            style={{ color: "var(--ql-cafe)" }}
          >
            100 points total. 70 to pass. Every check is deterministic.
          </p>
          <div
            className="rounded-[18px] overflow-hidden"
            style={{ border: "1px solid rgba(169,140,117,0.2)" }}
          >
            {PROOF_CHECKS.map(({ label, pts }, i) => (
              <div
                key={label}
                className="flex items-center justify-between px-6 py-4 text-sm"
                style={{
                  borderTop:
                    i > 0 ? "1px solid rgba(169,140,117,0.15)" : undefined,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <span style={{ color: "var(--ql-ashen)" }}>{label}</span>
                <span
                  className="font-mono font-semibold"
                  style={{ color: "#834A1F" }}
                >
                  {pts} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why QuestLock */}
      <section
        className="py-24 px-6"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--ql-bighorn)" }}
            >
              Proof over hype. Trust over noise.
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: "var(--ql-derby)" }}>
              QuestLock uses deterministic proof checks, not AI or subjective
              scoring. Every decision is explainable and every failure has a
              transparent reason.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--ql-derby)" }}>
              Anti-farm rules prevent duplicate submissions, reused demo URLs and
              multiple wallets per GitHub account. Attestations on EAS make proof
              results publicly verifiable.
            </p>
          </div>
          <div className="space-y-4">
            {[
              ["Deterministic checks", "No AI. No subjectivity. Pure objective rules."],
              ["EAS Attestations", "Public-safe proof results on Base Sepolia."],
              ["Anti-farm rules", "Duplicate detection prevents reward farming."],
              ["Gasless claiming", "Gelato Relay sponsors gas for reward claims."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="flex gap-4 p-4 rounded-xl"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-2 rounded-full shrink-0 mt-1"
                  style={{ background: "#834A1F", height: "auto" }}
                />
                <div>
                  <p
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: "var(--ql-bighorn)" }}
                  >
                    {title}
                  </p>
                  <p className="text-sm" style={{ color: "var(--ql-bear)" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{ background: "var(--ql-bighorn)" }}
        className="py-20 px-6 text-center"
      >
        <h2
          className="font-serif text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "#F6F1EA" }}
        >
          Ready to prove your work?
        </h2>
        <p className="mb-8" style={{ color: "var(--ql-cafe)" }}>
          Browse open quests on Base Sepolia testnet.
        </p>
        <Link
          href="/quests"
          className="inline-block px-10 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90"
          style={{ background: "#834A1F", color: "#F6F1EA" }}
        >
          Browse Quests →
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center text-xs"
        style={{
          background: "#0D0A07",
          color: "var(--ql-bear)",
          borderTop: "1px solid rgba(169,140,117,0.1)",
        }}
      >
        QuestLock v1 · Base Sepolia · Testnet infrastructure ·{" "}
        <span style={{ color: "var(--ql-cafe)" }}>
          Rewards follow proof, not farming.
        </span>
      </footer>
    </div>
  );
}
