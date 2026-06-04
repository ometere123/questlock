import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESSES } from "./contracts";

const APPROVAL_ABI = parseAbi([
  "function submitAndApprove(uint256 questId, address user, bytes32 proofHash, bytes32 attestationUID, uint16 score) external",
  "function rejectSubmission(uint256 questId, address user) external",
]);

function getVerifierClient() {
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
  return { walletClient, publicClient };
}

export async function approveSubmissionOnchain(params: {
  questId: bigint;
  user: `0x${string}`;
  proofHash: `0x${string}`;
  attestationUID: `0x${string}`;
  score: number;
}): Promise<string> {
  const { walletClient, publicClient } = getVerifierClient();

  // Single atomic call: submit proof hash + approve in one transaction
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.QUESTLOCK_CORE,
    abi: APPROVAL_ABI,
    functionName: "submitAndApprove",
    args: [
      params.questId,
      params.user,
      params.proofHash,
      params.attestationUID,
      params.score,
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === "reverted") {
    throw new Error(`submitAndApprove transaction reverted. Hash: ${hash}`);
  }

  return hash;
}

export async function rejectSubmissionOnchain(params: {
  questId: bigint;
  user: `0x${string}`;
}): Promise<string> {
  const { walletClient, publicClient } = getVerifierClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.QUESTLOCK_CORE,
    abi: APPROVAL_ABI,
    functionName: "rejectSubmission",
    args: [params.questId, params.user],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
