"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

interface ProofSubmissionFormProps {
  questId: string;
  questTitle: string;
}

export default function ProofSubmissionForm({
  questId,
  questTitle,
}: ProofSubmissionFormProps) {
  const { user, authenticated, login } = usePrivy();
  const router = useRouter();

  const [form, setForm] = useState({
    githubUsername: "",
    repoUrl: "",
    demoUrl: "",
    explanation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    submissionId?: string;
    status?: string;
    error?: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.githubUsername.trim()) e.githubUsername = "GitHub username is required.";
    if (!form.repoUrl.trim()) e.repoUrl = "Repository URL is required.";
    else if (!form.repoUrl.includes("github.com")) e.repoUrl = "Must be a GitHub URL.";
    if (form.demoUrl && !form.demoUrl.startsWith("http")) {
      e.demoUrl = "Demo URL must start with http:// or https://";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!authenticated || !user?.wallet?.address) {
      login();
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/proof/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          walletAddress: user.wallet.address,
          githubUsername: form.githubUsername.trim(),
          repoUrl: form.repoUrl.trim(),
          demoUrl: form.demoUrl.trim() || undefined,
          explanation: form.explanation.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "Submission failed." });
        return;
      }

      setResult({ submissionId: data.submissionId, status: data.status });

      if (data.submissionId) {
        router.push(`/submit/${questId}?submissionId=${data.submissionId}`);
      }
    } catch (err) {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!authenticated) {
    return (
      <div
        className="rounded-[18px] p-8 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="font-serif text-lg mb-2" style={{ color: "var(--ql-bighorn)" }}>
          Connect your wallet to submit proof
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--ql-derby)" }}>
          You need a connected wallet on Base Sepolia to participate.
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ql-bighorn)" }}
        >
          GitHub Username <span style={{ color: "#834A1F" }}>*</span>
        </label>
        <input
          type="text"
          value={form.githubUsername}
          onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
          placeholder="your-github-username"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2"
          style={{
            background: "var(--card)",
            border: `1px solid ${errors.githubUsername ? "#7A2020" : "var(--ql-cafe)"}`,
            color: "var(--ql-bighorn)",
          }}
        />
        {errors.githubUsername && (
          <p className="text-xs mt-1" style={{ color: "#7A2020" }}>
            {errors.githubUsername}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ql-bighorn)" }}
        >
          Repository URL <span style={{ color: "#834A1F" }}>*</span>
        </label>
        <input
          type="url"
          value={form.repoUrl}
          onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
          placeholder="https://github.com/username/repo-name"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 font-mono"
          style={{
            background: "var(--card)",
            border: `1px solid ${errors.repoUrl ? "#7A2020" : "var(--ql-cafe)"}`,
            color: "var(--ql-bighorn)",
          }}
        />
        {errors.repoUrl && (
          <p className="text-xs mt-1" style={{ color: "#7A2020" }}>
            {errors.repoUrl}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--ql-bear)" }}>
          Must be public. Repository owner must match your GitHub username.
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ql-bighorn)" }}
        >
          Demo URL
        </label>
        <input
          type="url"
          value={form.demoUrl}
          onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
          placeholder="https://your-demo.vercel.app"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 font-mono"
          style={{
            background: "var(--card)",
            border: `1px solid ${errors.demoUrl ? "#7A2020" : "var(--ql-cafe)"}`,
            color: "var(--ql-bighorn)",
          }}
        />
        {errors.demoUrl && (
          <p className="text-xs mt-1" style={{ color: "#7A2020" }}>
            {errors.demoUrl}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--ql-bear)" }}>
          Required for demo URL check (10 points). Must be publicly accessible.
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--ql-bighorn)" }}
        >
          Short Explanation{" "}
          <span className="text-xs font-normal" style={{ color: "var(--ql-bear)" }}>
            (optional)
          </span>
        </label>
        <textarea
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          placeholder="Briefly describe your project and what you built."
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 resize-none"
          style={{
            background: "var(--card)",
            border: "1px solid var(--ql-cafe)",
            color: "var(--ql-bighorn)",
          }}
        />
      </div>

      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        style={{ background: "var(--muted)" }}
      >
        <span style={{ color: "var(--ql-bear)" }}>Wallet:</span>
        <span className="font-mono text-xs" style={{ color: "var(--ql-bighorn)" }}>
          {user?.wallet?.address}
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: "var(--ql-ashen)", color: "var(--ql-derby)" }}
        >
          Base Sepolia
        </span>
      </div>

      {result?.error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: "#F0DADA", color: "#7A2020" }}
        >
          {result.error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-full font-semibold text-base transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#834A1F", color: "#F6F1EA" }}
      >
        {submitting ? "Running Proof Checks…" : "Submit Proof"}
      </button>

      {submitting && (
        <p className="text-xs text-center" style={{ color: "var(--ql-bear)" }}>
          Checking GitHub, scoring proof, running anti-farm checks… this takes 10–30 seconds.
        </p>
      )}
    </form>
  );
}
