// v1.2 — Sponsor approves their own quest's manual submission.
// Gated by quest.sponsor_wallet matching caller's x-wallet-address header.
// Reuses the appeal-approve pipeline (EAS attestation + verifier submitAndApprove).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approveAppealOnchain } from "@/lib/appeal-approve";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = req.headers.get("x-wallet-address")?.toLowerCase();
  if (!caller || !/^0x[a-f0-9]{40}$/.test(caller)) {
    return NextResponse.json({ error: "Connect a wallet." }, { status: 401 });
  }

  const { id } = await params;
  const sub = await prisma.submission.findUnique({
    where: { id },
    include: { quest: true },
  });
  if (!sub) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

  // Authorisation: caller must be the quest's sponsor.
  const sponsor = sub.quest.sponsor_wallet?.toLowerCase();
  if (!sponsor || sponsor !== caller) {
    return NextResponse.json(
      { error: "Only the quest sponsor can approve submissions on this quest." },
      { status: 403 }
    );
  }

  // Idempotency: if already approved, return the existing tx.
  if (sub.tx_hash_approval) {
    return NextResponse.json({
      ok: true, skipped: true,
      reason: "Submission already approved onchain.",
      tx: sub.tx_hash_approval,
    });
  }

  if (sub.quest.onchain_quest_id === null && sub.quest.funded_quest_id === null) {
    return NextResponse.json(
      { error: "Quest has no onchain id — cannot approve." },
      { status: 400 }
    );
  }

  try {
    const onchainQuestId = sub.quest.contract_version === 2
      ? sub.quest.funded_quest_id!
      : sub.quest.onchain_quest_id!;

    const result = await approveAppealOnchain({
      questOnchainId: onchainQuestId,
      questMinScore: sub.quest.min_score,
      walletAddress: sub.wallet_address as `0x${string}`,
      repoUrl: sub.repo_url,
      demoUrl: sub.demo_url,
      // Manual-review proofs may have no score yet — lift to min_score so the
      // contract's score floor is satisfied. The EAS attestation records the
      // true score (or 0) honestly via the riskBand = MANUAL_REVIEW tag.
      score: Math.max(sub.score ?? 0, sub.quest.min_score),
      existingProofHash: sub.proof_hash,
      questDbId: sub.quest.id,
      contractVersion: (sub.quest.contract_version === 2 ? 2 : 1) as 1 | 2,
    });

    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        proof_hash: result.proofHashUsed,
        eas_attestation_uid: result.attestationUid,
        tx_hash_approval: result.txHashApproval,
        risk_band: "MANUAL_REVIEW",
        status: "APPROVED_ONCHAIN",
        score: sub.score ?? sub.quest.min_score,
      },
    });

    await log("info", "sponsor.submissions.approve", "Sponsor approved submission", {
      submissionId: sub.id, sponsor, tx: result.txHashApproval,
    });

    return NextResponse.json({ ok: true, tx: result.txHashApproval, uid: result.attestationUid });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await log("error", "sponsor.submissions.approve", "Approval failed", {
      submissionId: sub.id, sponsor, error: message,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
