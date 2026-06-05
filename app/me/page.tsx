"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import GithubConnectCard from "@/components/GithubConnectCard";
import DiscordConnectCard from "@/components/DiscordConnectCard";
import DisplayNameCard from "@/components/DisplayNameCard";
import { easAttestationUrl, explorerTxUrl } from "@/lib/chains";
import Link from "next/link";

interface Submission {
  id: string;
  status: string;
  score: number | null;
  repo_url: string;
  demo_url: string | null;
  eas_attestation_uid: string | null;
  tx_hash_approval: string | null;
  tx_hash_claim: string | null;
  created_at: string;
  quest: {
    title: string;
    reward_amount: string;
    badge_id: number;
  };
}

const BADGE_NAMES: Record<number, string> = {
  1: "Verified Builder",
  2: "GitHub Contributor",
  3: "Protocol Researcher",
  4: "Serious Learner",
};

export default function ProfilePage() {
  const { authenticated, user, login } = usePrivy();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const walletAddress = user?.wallet?.address;
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}`
    : null;

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    fetch(`/api/submissions?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then((d) => setSubmissions(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [walletAddress]);

  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center py-16 px-6"
        style={{ background: "var(--background)" }}
      >
        <p
          className="font-serif text-2xl mb-3"
          style={{ color: "var(--ql-bighorn)" }}
        >
          Connect to view your profile
        </p>
        <button
          onClick={login}
          className="px-6 py-3 rounded-full font-medium text-sm"
          style={{ background: "#834A1F", color: "#F6F1EA" }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const completed = submissions.filter((s) => s.status === "CLAIMED");
  const pending = submissions.filter((s) =>
    ["SUBMITTED", "FETCHING_PROOF", "EVALUATING", "ATTESTING", "APPROVING_ONCHAIN", "PASSED", "ATTESTED"].includes(s.status)
  );
  const claimable = submissions.filter((s) => s.status === "APPROVED_ONCHAIN");
  const failed = submissions.filter((s) =>
    ["FAILED", "REJECTED", "CLAIM_FAILED"].includes(s.status)
  );

  return (
    <div
      className="min-h-screen py-10 px-6"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="rounded-[18px] p-8 mb-8 flex flex-wrap items-center gap-6"
          style={{ background: "var(--ql-bighorn)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: "#834A1F", color: "#F6F1EA" }}
          >
            {shortAddr?.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: "var(--ql-cafe)" }}
            >
              Builder Profile
            </p>
            <p
              className="font-mono text-sm"
              style={{ color: "#F6F1EA" }}
            >
              {shortAddr}
            </p>
            {user?.wallet?.address && (
              <p className="text-xs mt-0.5" style={{ color: "var(--ql-bear)" }}>
                {user.wallet.address}
              </p>
            )}
          </div>
          <div
            className="ml-auto flex gap-6 text-center"
          >
            <div>
              <p className="text-2xl font-bold font-mono" style={{ color: "#F6F1EA" }}>
                {completed.length}
              </p>
              <p className="text-xs" style={{ color: "var(--ql-cafe)" }}>Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono" style={{ color: "#834A1F" }}>
                {claimable.length}
              </p>
              <p className="text-xs" style={{ color: "var(--ql-cafe)" }}>Claimable</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono" style={{ color: "var(--ql-cafe)" }}>
                {pending.length}
              </p>
              <p className="text-xs" style={{ color: "var(--ql-cafe)" }}>Pending</p>
            </div>
          </div>
        </div>

        {walletAddress && <DisplayNameCard walletAddress={walletAddress} />}
        {walletAddress && <GithubConnectCard walletAddress={walletAddress} />}
        {walletAddress && <DiscordConnectCard walletAddress={walletAddress} />}

        {loading ? (
          <p className="text-center py-12" style={{ color: "var(--ql-bear)" }}>
            Loading submissions…
          </p>
        ) : submissions.length === 0 ? (
          <div
            className="text-center py-20 rounded-[18px]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p
              className="font-serif text-xl mb-2"
              style={{ color: "var(--ql-bighorn)" }}
            >
              No submissions yet
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--ql-derby)" }}>
              Submit proof for an open quest to get started.
            </p>
            <Link
              href="/quests"
              className="inline-block px-6 py-2.5 rounded-full text-sm font-medium"
              style={{ background: "#834A1F", color: "#F6F1EA" }}
            >
              Browse Quests
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: "Claimable Rewards", items: claimable },
              { label: "Completed Quests", items: completed },
              { label: "Pending", items: pending },
              { label: "Rejected / Failed", items: failed },
            ].map(({ label, items }) =>
              items.length === 0 ? null : (
                <section key={label}>
                  <h2
                    className="font-serif text-lg font-semibold mb-3"
                    style={{ color: "var(--ql-bighorn)" }}
                  >
                    {label}
                  </h2>
                  <div className="space-y-3">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-[18px] p-5"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "var(--ql-bighorn)" }}
                            >
                              {s.quest.title}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--ql-bear)" }}
                            >
                              {s.quest.reward_amount} QUEST ·{" "}
                              {BADGE_NAMES[Number(s.quest.badge_id)] || "Badge"} ·
                              Score: {s.score ?? "—"}
                            </p>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs">
                          {s.eas_attestation_uid && (
                            <a
                              href={easAttestationUrl(s.eas_attestation_uid)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#834A1F" }}
                            >
                              Attestation →
                            </a>
                          )}
                          {s.tx_hash_claim && (
                            <a
                              href={explorerTxUrl(s.tx_hash_claim)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#834A1F" }}
                            >
                              Claim tx →
                            </a>
                          )}
                          {s.tx_hash_approval && (
                            <a
                              href={explorerTxUrl(s.tx_hash_approval)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--ql-bear)" }}
                            >
                              Approval tx →
                            </a>
                          )}
                          {s.status === "APPROVED_ONCHAIN" && (
                            <Link
                              href={`/submit/${s.quest}?submissionId=${s.id}`}
                              className="font-semibold"
                              style={{ color: "#834A1F" }}
                            >
                              Claim reward →
                            </Link>
                          )}
                          {["APPROVED_ONCHAIN", "CLAIMING", "CLAIMED", "ATTESTED"].includes(s.status) && (
                            <Link
                              href={`/proof/${s.id}`}
                              style={{ color: "#834A1F" }}
                            >
                              Public proof →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
