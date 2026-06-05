"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

interface SponsorQuest {
  id: string;
  title: string;
  contract_version: number;
  funding_status: string;
  reward_amount: string;
  max_claims: number;
  funded_amount: string | null;
  required_funding: string | null;
  status: string;
  deadline: string;
  _count: { submissions: number };
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  FUNDED: { bg: "#2D5A2D", fg: "#F6F1EA" },
  PARTIALLY_FUNDED: { bg: "#7A5A20", fg: "#FFF1D6" },
  UNFUNDED: { bg: "#7A5A20", fg: "#FFF1D6" },
  UNDERFUNDED: { bg: "#6B3838", fg: "#F0DADA" },
  CLOSED: { bg: "#3a3a3a", fg: "var(--ql-cafe)" },
  REFUNDED: { bg: "#3a3a3a", fg: "var(--ql-cafe)" },
  LEGACY_SHARED: { bg: "rgba(255,255,255,0.06)", fg: "var(--ql-cafe)" },
};

export default function SponsorHome() {
  const { authenticated, user, login } = usePrivy();
  const [quests, setQuests] = useState<SponsorQuest[]>([]);
  const [loading, setLoading] = useState(false);
  const wallet = user?.wallet?.address;

  useEffect(() => {
    if (!wallet) return;
    setLoading(true);
    fetch(`/api/sponsor/quests?wallet=${wallet}`)
      .then((r) => r.json())
      .then((d) => setQuests(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wallet]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--background)" }}>
        <p className="font-sans text-2xl mb-3" style={{ color: "var(--ql-bighorn)" }}>
          Connect to view your sponsored quests
        </p>
        <button onClick={login} className="px-6 py-3 rounded-full font-medium text-sm"
          style={{ background: "#834A1F", color: "#F6F1EA" }}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-sans text-3xl font-bold" style={{ color: "var(--ql-bighorn)" }}>
              Sponsor Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ql-derby)" }}>
              Quests where you are recorded as sponsor.
            </p>
          </div>
          <Link href="/create" className="px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "#834A1F", color: "#F6F1EA" }}>+ Request quest</Link>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: "var(--ql-bear)" }}>Loading…</p>
        ) : quests.length === 0 ? (
          <div className="rounded-[18px] p-10 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="font-sans text-lg mb-2" style={{ color: "var(--ql-bighorn)" }}>
              No sponsored quests yet
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--ql-derby)" }}>
              Request a quest at <Link href="/create" className="underline" style={{ color: "#834A1F" }}>/create</Link> —
              once an admin approves and publishes it, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quests.map((q) => {
              const tone = STATUS_TONE[q.funding_status] || STATUS_TONE.LEGACY_SHARED;
              return (
                <Link key={q.id} href={`/sponsor/quests/${q.id}`}
                  className="block rounded-[18px] p-6 transition-opacity hover:opacity-90"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <p className="font-semibold text-lg" style={{ color: "var(--ql-bighorn)" }}>{q.title}</p>
                    <div className="flex items-center gap-2">
                      {q.contract_version === 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "var(--muted)", color: "var(--ql-derby)" }}>v1.2 funded</span>
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: tone.bg, color: tone.fg }}>
                        {q.funding_status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--ql-bear)" }}>
                    {q.reward_amount} QUEST · {q._count.submissions}/{q.max_claims} claimed
                    {q.contract_version === 2 && q.funded_amount && q.required_funding && (
                      <> · funded {q.funded_amount}/{q.required_funding}</>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
