import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import { CONTRACT_ADDRESSES } from "./contracts";
import { prisma } from "./prisma";
import { serializeBigInt } from "./bigint";

const EVENT_SIGNATURES = [
  parseAbiItem(
    "event QuestCreated(uint256 indexed questId, address indexed creator, address rewardToken, uint256 rewardAmount, uint256 deadline)"
  ),
  parseAbiItem(
    "event ProofSubmitted(uint256 indexed questId, address indexed user, bytes32 proofHash)"
  ),
  parseAbiItem(
    "event SubmissionApproved(uint256 indexed questId, address indexed user, bytes32 attestationUID, uint16 score)"
  ),
  parseAbiItem(
    "event SubmissionRejected(uint256 indexed questId, address indexed user)"
  ),
  parseAbiItem(
    "event RewardClaimed(uint256 indexed questId, address indexed user, uint256 rewardAmount, uint256 badgeId)"
  ),
];

const BLOCK_WINDOW = 4000n;

export async function indexContractEvents(): Promise<{
  scanned: bigint;
  inserted: number;
}> {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  // Find the most recent indexed block, or start from now - BLOCK_WINDOW
  const latestEvent = await prisma.contractEvent.findFirst({
    orderBy: { block_number: "desc" },
  });

  const tipBlock = await publicClient.getBlockNumber();
  let fromBlock = latestEvent
    ? BigInt(latestEvent.block_number) + 1n
    : tipBlock > BLOCK_WINDOW
    ? tipBlock - BLOCK_WINDOW
    : 0n;

  let inserted = 0;

  for (const event of EVENT_SIGNATURES) {
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.QUESTLOCK_CORE,
      event,
      fromBlock,
      toBlock: tipBlock,
    });

    for (const log of logs) {
      const exists = await prisma.contractEvent.findFirst({
        where: {
          tx_hash: log.transactionHash,
          event_name: event.name,
        },
      });
      if (exists) continue;

      const args = (log as unknown as { args: Record<string, unknown> }).args || {};

      await prisma.contractEvent.create({
        data: {
          event_name: event.name,
          tx_hash: log.transactionHash,
          block_number: BigInt(log.blockNumber),
          quest_id: (args.questId as bigint | undefined)?.toString() || null,
          wallet_address:
            (args.user as string | undefined) ||
            (args.creator as string | undefined) ||
            null,
          payload_json: serializeBigInt(args) as object,
        },
      });
      inserted++;
    }
  }

  return { scanned: tipBlock - fromBlock, inserted };
}
