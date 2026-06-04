export const CONTRACT_ADDRESSES = {
  QUESTLOCK_CORE: process.env.NEXT_PUBLIC_QUESTLOCK_CORE_ADDRESS as `0x${string}`,
  QUEST_REWARD_TOKEN: process.env.NEXT_PUBLIC_QUEST_REWARD_TOKEN_ADDRESS as `0x${string}`,
  QUEST_BADGE: process.env.NEXT_PUBLIC_QUEST_BADGE_ADDRESS as `0x${string}`,
  EAS: (process.env.NEXT_PUBLIC_EAS_CONTRACT_ADDRESS ||
    "0x4200000000000000000000000000000000000021") as `0x${string}`,
};

export const QUEST_LOCK_CORE_ABI = [
  {
    inputs: [
      { name: "questId", type: "uint256" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "questId", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    name: "submitProofHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "questId", type: "uint256" }],
    name: "getQuest",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "rewardToken", type: "address" },
          { name: "rewardAmount", type: "uint256" },
          { name: "badgeId", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "maxClaims", type: "uint256" },
          { name: "totalClaims", type: "uint256" },
          { name: "minScore", type: "uint16" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "questId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getSubmission",
    outputs: [
      {
        components: [
          { name: "proofHash", type: "bytes32" },
          { name: "attestationUID", type: "bytes32" },
          { name: "score", type: "uint16" },
          { name: "status", type: "uint8" },
          { name: "submittedAt", type: "uint256" },
          { name: "reviewedAt", type: "uint256" },
          { name: "claimedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "questId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "rewardAmount", type: "uint256" },
      { indexed: false, name: "badgeId", type: "uint256" },
    ],
    name: "RewardClaimed",
    type: "event",
  },
] as const;
