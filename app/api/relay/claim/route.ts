import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { log } from "@/lib/logger";
import { identifyRequest, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const CLAIM_ABI = parseAbi([
  "function claimRewardFor(uint256 questId, address user) external",
]);

export async function POST(req: NextRequest) {
  let submissionId: string | undefined;

  try {
    const body = await req.json();
    submissionId = body.submissionId;
    const walletAddress: string = body.walletAddress;

    if (!submissionId || !walletAddress) {
      return NextResponse.json(
        { error: "Missing submissionId or walletAddress." },
        { status: 400 }
      );
    }

    const rl = rateLimit(
      identifyRequest(req, walletAddress),
      RATE_LIMITS.relayClaim
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many claim attempts.", retryAfterMs: rl.retryAfterMs },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
        }
      );
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { quest: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    if (submission.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Wallet mismatch." }, { status: 403 });
    }
    if (submission.status !== "APPROVED_ONCHAIN") {
      return NextResponse.json(
        { error: "Submission is not approved for claim." },
        { status: 400 }
      );
    }
    if (!submission.quest.onchain_quest_id) {
      return NextResponse.json({ error: "Quest has no onchain ID." }, { status: 400 });
    }

    await log("info", "relay/claim", "Gasless claim initiated", {
      submissionId,
      walletAddress,
    });

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "CLAIMING" },
    });

    if (!process.env.VERIFIER_PRIVATE_KEY) {
      throw new Error("VERIFIER_PRIVATE_KEY not set");
    }

    const account = privateKeyToAccount(
      process.env.VERIFIER_PRIVATE_KEY as `0x${string}`
    );
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.QUESTLOCK_CORE,
      abi: CLAIM_ABI,
      functionName: "claimRewardFor",
      args: [submission.quest.onchain_quest_id, walletAddress as `0x${string}`],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "CLAIMED", tx_hash_claim: txHash },
    });

    await log("info", "relay/claim", "Claim successful", { submissionId, txHash });

    return NextResponse.json({ success: true, txHash });
  } catch (err) {
    console.error("[relay/claim]", err);

    if (submissionId) {
      await prisma.submission
        .update({
          where: { id: submissionId },
          data: { status: "APPROVED_ONCHAIN" },
        })
        .catch(() => {});
    }

    return NextResponse.json(
      { error: "Failed to submit claim. Please try again." },
      { status: 500 }
    );
  }
}
