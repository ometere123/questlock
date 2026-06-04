"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";

interface MyRequest {
  id: string;
  title: string;
  reward_amount: string;
  status: string;
  onchain_quest_id: string | null;
  published_quest_id: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, { text: string; tone: "warn" | "ok" | "error" | "info" }> = {
  PENDING_REVIEW: { text: "Pending review", tone: "warn" },
  APPROVED: { text: "Approved · awaiting publish", tone: "info" },
  PUBLISHING: { text: "Publishing onchain…", tone: "info" },
  PUBLISHED: { text: "Published", tone: "ok" },
  PUBLISH_FAILED: { text: "Publish failed", tone: "error" },
  REJECTED: { text: "Rejected", tone: "error" },
};

function statusStyle(tone: string) {
  if (tone === "ok") return { background: "#D9EDD9", color: "#2D5A2D" };
  if (tone === "warn") return { background: "#FFF1D6", color: "#7A5A20" };
  if (tone === "error") return { background: "#F0DADA", color: "#7A2020" };
  return { background: "var(--muted)", color: "var(--ql-derby)" };
}

export default function CreatePage() {
  const { authenticated, user, login } = usePrivy();
  const wallet = user?.wallet?.address;

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    reward_amount: "10",
    badge_id: "1",
    min_score: "70",
    max_claims: "50",
    deadline_days: "30",
    sponsor_name: "",
    sponsor_email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);

  async function refreshMine() {
    if (!wallet) return;
    const r = await fetch(`/api/quest-requests?wallet=${wallet}`);
    if (r.ok) setMyRequests(await r.json());
  }

  useEffect(() => {
    if (wallet) refreshMine();
  }, [wallet]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) {
      login();
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setResult({ error: "Title and description are required." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/quest-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          badge_id: Number(form.badge_id),
          min_score: Number(form.min_score),
          max_claims: Number(form.max_claims),
          deadline_days: Number(form.deadline_days),
          sponsor_wallet: wallet,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setResult({ error: d.error || "Failed to submit." });
        return;
      }
      setResult({ ok: true });
      setForm((f) => ({ ...f, title: "", description: "", requirements: "" }));
      refreshMine();
    } catch (err) {
      setResult({ error: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none";
  const inputStyle = {
    background: "var(--card)",
    border: "1px solid var(--ql-cafe)",
    color: "var(--ql-bighorn)",
  };
  const labelStyle = {
    color: "var(--ql-bighorn)",
    fontSize: "13px",
    fontWeight: 500,
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-sans text-4xl font-bold mb-2" style={{ color: "var(--ql-bighorn)" }}>
          Request a Quest
        </h1>
        <p className="mb-10" style={{ color: "var(--ql-derby)" }}>
          Sponsor a builder quest. QuestLock reviews every request before it goes live on
          Base Sepolia. You stay in control: nothing publishes onchain without admin confirmation.
        </p>

        {!authenticated ? (
          <div
            className="rounded-[18px] p-8 text-center mb-8"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p className="font-sans text-lg mb-3" style={{ color: "var(--ql-bighorn)" }}>
              Connect a wallet to submit a request
            </p>
            <button
              onClick={login}
              className="px-6 py-3 rounded-full font-medium text-sm"
              style={{ background: "#834A1F", color: "#F6F1EA" }}
            >
              Connect
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-[18px] p-7 mb-8 space-y-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div>
              <label style={labelStyle}>Quest title *</label>
              <input
                className={inputCls}
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Build a Subgraph for X"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea
                className={inputCls}
                style={inputStyle}
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What should builders ship? What's the goal?"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Specific requirements (optional)</label>
              <textarea
                className={inputCls}
                style={inputStyle}
                rows={3}
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder="e.g. must use Hardhat 3, must include tests, must deploy to Base Sepolia"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label style={labelStyle}>Reward (QUEST)</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={form.reward_amount}
                  onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Badge</label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={form.badge_id}
                  onChange={(e) => setForm({ ...form, badge_id: e.target.value })}
                >
                  <option value="1">Verified Builder</option>
                  <option value="2">GitHub Contributor</option>
                  <option value="3">Protocol Researcher</option>
                  <option value="4">Serious Learner</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Min score</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="number"
                  min={0}
                  max={100}
                  value={form.min_score}
                  onChange={(e) => setForm({ ...form, min_score: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Max claims</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={form.max_claims}
                  onChange={(e) => setForm({ ...form, max_claims: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Deadline (days)</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={form.deadline_days}
                  onChange={(e) => setForm({ ...form, deadline_days: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Sponsor name (optional)</label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={form.sponsor_name}
                  onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
                  placeholder="Your team / project"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Sponsor email (optional)</label>
              <input
                className={inputCls}
                style={inputStyle}
                type="email"
                value={form.sponsor_email}
                onChange={(e) => setForm({ ...form, sponsor_email: e.target.value })}
                placeholder="ops@yourteam.xyz"
              />
            </div>

            <div
              className="px-4 py-3 rounded-xl text-xs"
              style={{ background: "var(--muted)", color: "var(--ql-derby)" }}
            >
              Signing wallet:{" "}
              <span className="font-mono">{wallet}</span>
            </div>

            {result?.error && (
              <p className="text-xs" style={{ color: "#7A2020" }}>{result.error}</p>
            )}
            {result?.ok && (
              <p className="text-xs" style={{ color: "#2D5A2D" }}>
                Submitted. The QuestLock team will review your request.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-full font-semibold text-sm disabled:opacity-60"
              style={{ background: "#834A1F", color: "#F6F1EA" }}
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        )}

        {/* Your requests */}
        {authenticated && (
          <div
            className="rounded-[18px] p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-sans text-lg font-semibold mb-4" style={{ color: "var(--ql-bighorn)" }}>
              Your requests
            </h2>
            {myRequests.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--ql-bear)" }}>
                You haven&apos;t submitted any quest requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => {
                  const meta = STATUS_LABEL[r.status] || { text: r.status, tone: "info" as const };
                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--muted)" }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: "var(--ql-bighorn)" }}>
                          {r.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--ql-bear)" }}>
                          {r.reward_amount} QUEST · {new Date(r.created_at).toLocaleDateString()}
                        </p>
                        {r.rejection_reason && (
                          <p className="text-xs mt-1" style={{ color: "#7A2020" }}>
                            {r.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wider"
                          style={statusStyle(meta.tone)}
                        >
                          {meta.text}
                        </span>
                        {r.status === "PUBLISHED" && r.published_quest_id && (
                          <Link
                            href={`/quests/${r.published_quest_id}`}
                            className="text-xs"
                            style={{ color: "#834A1F" }}
                          >
                            View quest →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
