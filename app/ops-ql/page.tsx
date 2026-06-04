"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

interface Quest {
  id: string;
  title: string;
  reward_amount: string;
  status: string;
  deadline: string;
  max_claims: number;
  _count?: { submissions: number };
}

interface Submission {
  id: string;
  status: string;
  score: number | null;
  risk_band: string | null;
  wallet_address: string;
  github_username: string;
  repo_url: string;
  created_at: string;
  quest: { title: string };
}

function AdminQuestForm({ onCreated }: { onCreated: () => void }) {
  const { user } = usePrivy();
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward_amount: "10",
    badge_id: "1",
    min_score: "70",
    max_claims: "100",
    deadline: "",
    start_time: new Date().toISOString().slice(0, 16),
    onchain_quest_id: "",
    reward_token_address: process.env.NEXT_PUBLIC_QUEST_REWARD_TOKEN_ADDRESS || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": user?.wallet?.address || "",
        },
        body: JSON.stringify({
          ...form,
          created_by: user?.wallet?.address || "admin",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create quest.");
      }
      setSuccess(true);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="rounded-[18px] p-6 text-center"
        style={{ background: "#D9EDD9" }}
      >
        <p className="font-semibold" style={{ color: "#2D5A2D" }}>
          Quest created successfully.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm mt-2"
          style={{ color: "#2D5A2D" }}
        >
          Create another
        </button>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(169,140,117,0.3)",
    color: "#F6F1EA",
  };
  const labelStyle = { color: "var(--ql-cafe)", marginBottom: "6px", display: "block", fontSize: "12px" };

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label style={labelStyle}>Quest Title *</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Build a Simple Onchain Guestbook"
            required
          />
        </div>
        <div className="col-span-2">
          <label style={labelStyle}>Description</label>
          <textarea
            className={inputCls}
            style={inputStyle}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Build and deploy a project with a frontend, contracts, and working demo."
          />
        </div>
        <div>
          <label style={labelStyle}>Reward Amount (QUEST)</label>
          <input className={inputCls} style={inputStyle} type="number" value={form.reward_amount} onChange={(e) => setForm({ ...form, reward_amount: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Badge ID</label>
          <select className={inputCls} style={inputStyle} value={form.badge_id} onChange={(e) => setForm({ ...form, badge_id: e.target.value })}>
            <option value="1">1 — Verified Builder</option>
            <option value="2">2 — GitHub Contributor</option>
            <option value="3">3 — Protocol Researcher</option>
            <option value="4">4 — Serious Learner</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Min Score (0–100)</label>
          <input className={inputCls} style={inputStyle} type="number" min={0} max={100} value={form.min_score} onChange={(e) => setForm({ ...form, min_score: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Max Claims</label>
          <input className={inputCls} style={inputStyle} type="number" value={form.max_claims} onChange={(e) => setForm({ ...form, max_claims: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Start Time</label>
          <input className={inputCls} style={inputStyle} type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Deadline *</label>
          <input className={inputCls} style={inputStyle} type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
        </div>
        <div>
          <label style={labelStyle}>Onchain Quest ID (after contract deploy)</label>
          <input className={inputCls} style={inputStyle} type="number" value={form.onchain_quest_id} onChange={(e) => setForm({ ...form, onchain_quest_id: e.target.value })} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle}>Reward Token Address</label>
          <input className={`${inputCls} font-mono text-xs`} style={inputStyle} value={form.reward_token_address} onChange={(e) => setForm({ ...form, reward_token_address: e.target.value })} />
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: "#F0DADA" }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-full font-medium text-sm disabled:opacity-60"
        style={{ background: "#834A1F", color: "#F6F1EA" }}
      >
        {submitting ? "Creating…" : "Create Quest"}
      </button>
    </form>
  );
}

export default function AdminPage() {
  const { authenticated, user, login } = usePrivy();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<"quests" | "submissions" | "create">("quests");

  async function loadData() {
    const [qRes, sRes] = await Promise.all([
      fetch("/api/admin/quests", { headers: { "x-wallet-address": user?.wallet?.address || "" } }),
      fetch("/api/admin/submissions", { headers: { "x-wallet-address": user?.wallet?.address || "" } }),
    ]);
    if (qRes.ok) setQuests(await qRes.json());
    if (sRes.ok) setSubmissions(await sRes.json());
  }

  useEffect(() => {
    if (authenticated && user?.wallet?.address) loadData();
  }, [authenticated, user?.wallet?.address]);

  const ADMIN_WALLET = "0x1f63ea74065586Af0C7c48428372D88d0A89525B".toLowerCase();
  const isAdmin = authenticated && user?.wallet?.address?.toLowerCase() === ADMIN_WALLET;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--ql-bighorn)" }}>
        <p className="font-serif text-2xl mb-4" style={{ color: "#F6F1EA" }}>Connect wallet</p>
        <button onClick={login} className="px-6 py-3 rounded-full font-medium text-sm" style={{ background: "#834A1F", color: "#F6F1EA" }}>
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--ql-bighorn)" }}>
        <p className="font-serif text-2xl mb-2" style={{ color: "#F6F1EA" }}>Access denied.</p>
        <p className="text-sm" style={{ color: "var(--ql-cafe)" }}>This page is restricted.</p>
      </div>
    );
  }

  const tabs = [
    { key: "quests", label: "Quests" },
    { key: "submissions", label: "Submissions" },
    { key: "create", label: "Create Quest" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--ql-bighorn)" }}>
      <div className="max-w-6xl mx-auto py-10 px-6">
        <h1 className="font-serif text-3xl font-bold mb-8" style={{ color: "#F6F1EA" }}>
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={
                tab === t.key
                  ? { background: "#834A1F", color: "#F6F1EA" }
                  : { background: "rgba(255,255,255,0.07)", color: "var(--ql-cafe)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Create Quest */}
        {tab === "create" && (
          <div
            className="rounded-[18px] p-8 max-w-2xl"
            style={{ background: "var(--ql-night)", border: "1px solid rgba(169,140,117,0.2)" }}
          >
            <h2 className="font-serif text-xl font-semibold mb-6" style={{ color: "#F6F1EA" }}>
              Create Quest
            </h2>
            <AdminQuestForm onCreated={() => { loadData(); setTab("quests"); }} />
          </div>
        )}

        {/* Quests */}
        {tab === "quests" && (
          <div className="overflow-auto rounded-[18px]" style={{ border: "1px solid rgba(169,140,117,0.2)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--ql-night)" }}>
                  {["Title", "Reward", "Status", "Deadline", "Claims"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium text-xs uppercase tracking-wider" style={{ color: "var(--ql-cafe)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--ql-bear)" }}>
                      No quests yet.
                    </td>
                  </tr>
                ) : quests.map((q, i) => (
                  <tr key={q.id} style={{ borderTop: i > 0 ? "1px solid rgba(169,140,117,0.1)" : undefined, background: "rgba(255,255,255,0.02)" }}>
                    <td className="px-5 py-3" style={{ color: "#F6F1EA" }}>
                      <Link href={`/quests/${q.id}`} style={{ color: "#F6F1EA" }}>{q.title}</Link>
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--ql-ashen)" }}>{q.reward_amount} QUEST</td>
                    <td className="px-5 py-3"><StatusBadge status={q.status === "active" ? "APPROVED_ONCHAIN" : "REJECTED"} /></td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--ql-cafe)" }}>{new Date(q.deadline).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: "var(--ql-cafe)" }}>{q._count?.submissions || 0}/{q.max_claims}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Submissions */}
        {tab === "submissions" && (
          <div className="overflow-auto rounded-[18px]" style={{ border: "1px solid rgba(169,140,117,0.2)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--ql-night)" }}>
                  {["Wallet", "Quest", "Score", "Risk", "Status", "Date", "Detail"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider" style={{ color: "var(--ql-cafe)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: "var(--ql-bear)" }}>
                      No submissions yet.
                    </td>
                  </tr>
                ) : submissions.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: i > 0 ? "1px solid rgba(169,140,117,0.1)" : undefined, background: "rgba(255,255,255,0.02)" }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--ql-ashen)" }}>{s.wallet_address.slice(0, 10)}…</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--ql-ashen)" }}>{s.quest.title}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "var(--ql-ashen)" }}>{s.score ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: s.risk_band === "HIGH_RISK" ? "#F0DADA" : "var(--ql-cafe)" }}>{s.risk_band?.replace("_RISK", "") || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--ql-cafe)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/ops-ql/submissions/${s.id}`} className="text-xs underline" style={{ color: "#834A1F" }}>
                        Inspect
                      </Link>
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
