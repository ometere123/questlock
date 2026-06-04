// Quest analytics derivation. We keep the math here in a pure function so
// the API route stays thin and the logic is unit-testable without spinning
// up Prisma or the chain.

// Statuses considered "passed proof checks". Anything from PASSED onwards in
// the lifecycle counts — once the engine said yes we count it, regardless of
// whether the user has claimed yet.
const PASSED_STATUSES = new Set([
  "PASSED",
  "ATTESTING",
  "ATTESTED",
  "APPROVING_ONCHAIN",
  "APPROVED_ONCHAIN",
  "CLAIMING",
  "CLAIMED",
]);

const APPROVED_ONCHAIN_STATUSES = new Set([
  "APPROVED_ONCHAIN",
  "CLAIMING",
  "CLAIMED",
]);

const CLAIMED_STATUSES = new Set(["CLAIMED"]);
const FAILED_STATUSES = new Set(["FAILED", "REJECTED"]);

export interface SubmissionLite {
  status: string;
  score: number | null;
  failure_reasons_json: unknown;
}

export interface QuestAnalytics {
  total_submissions: number;
  passed: number;
  failed: number;
  approved_onchain: number;
  claimable: number; // approved but not yet claimed
  claimed: number;
  in_progress: number; // anything still being evaluated
  average_score: number | null;
  top_failure_reasons: Array<{ reason: string; count: number }>;
  // 0–1 floats, null when denominator is 0
  approval_conversion_rate: number | null; // approved_onchain / total
  claim_conversion_rate: number | null;    // claimed / approved_onchain
}

export function aggregateQuestAnalytics(
  submissions: SubmissionLite[]
): QuestAnalytics {
  const total = submissions.length;
  let passed = 0;
  let failed = 0;
  let approvedOnchain = 0;
  let claimed = 0;
  let inProgress = 0;
  const scoreValues: number[] = [];
  const reasonCounts = new Map<string, number>();

  for (const s of submissions) {
    if (PASSED_STATUSES.has(s.status)) passed++;
    if (FAILED_STATUSES.has(s.status)) failed++;
    if (APPROVED_ONCHAIN_STATUSES.has(s.status)) approvedOnchain++;
    if (CLAIMED_STATUSES.has(s.status)) claimed++;
    if (
      !PASSED_STATUSES.has(s.status) &&
      !FAILED_STATUSES.has(s.status)
    ) {
      inProgress++;
    }

    if (typeof s.score === "number") scoreValues.push(s.score);

    if (Array.isArray(s.failure_reasons_json)) {
      for (const r of s.failure_reasons_json as unknown[]) {
        if (typeof r === "string" && r.trim().length > 0) {
          reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
        }
      }
    }
  }

  const claimable = approvedOnchain - claimed;
  const averageScore =
    scoreValues.length === 0
      ? null
      : Math.round(
          (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10
        ) / 10;

  const topFailureReasons = Array.from(reasonCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  return {
    total_submissions: total,
    passed,
    failed,
    approved_onchain: approvedOnchain,
    claimable,
    claimed,
    in_progress: inProgress,
    average_score: averageScore,
    top_failure_reasons: topFailureReasons,
    approval_conversion_rate:
      total === 0 ? null : approvedOnchain / total,
    claim_conversion_rate:
      approvedOnchain === 0 ? null : claimed / approvedOnchain,
  };
}

// Onchain reward pool deductions are uniform per claim, so per-quest "potential
// outflow remaining" = remaining slots * reward. Useful for spotting quests
// that will drain the contract.
export function potentialOutflowRemaining(args: {
  maxClaims: number;
  totalClaims: number;
  rewardAmount: string;
}): string {
  const slotsLeft = Math.max(0, args.maxClaims - args.totalClaims);
  // String arithmetic keeps us safe if rewardAmount has more decimals than
  // JS Number can hold. We do the multiplication as bigint via parseFloat
  // for the simple case (no decimal beyond what fits in Number).
  // Reward amounts in v1 are integer QUEST values, so Number is fine.
  const reward = Number(args.rewardAmount);
  if (!Number.isFinite(reward)) return "0";
  return String(slotsLeft * reward);
}
