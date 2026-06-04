// Whitelist of fields safe to expose on public proof certificate pages.
// We deliberately exclude: explanation, failure_reasons_json,
// raw GitHub API responses, and any other field that could leak private
// signals or admin notes. The whitelist lives here so the rule is enforced
// by code, not by convention.

const ALLOWED_STATUSES = new Set([
  "APPROVED_ONCHAIN",
  "CLAIMING",
  "CLAIMED",
  "ATTESTED",
]);

export function isPubliclyVisible(status: string): boolean {
  return ALLOWED_STATUSES.has(status);
}

export interface PublicProofCheck {
  check_name: string;
  passed: boolean;
  points_awarded: number;
  max_points: number;
}

export interface PublicProof {
  id: string;
  status: string;
  score: number;
  risk_band: string;
  wallet_address: string;
  github_login: string | null;
  github_avatar_url: string | null;
  github_profile_url: string | null;
  repo_url: string;
  demo_url: string | null;
  proof_hash: string | null;
  eas_attestation_uid: string | null;
  tx_hash_approval: string | null;
  tx_hash_claim: string | null;
  claimed_at: string | null;
  approved_at: string | null;
  quest: {
    id: string;
    title: string;
    description: string;
    reward_amount: string;
    badge_id: string;
    min_score: number;
  };
  proof_checks: PublicProofCheck[];
}

// Type the input loosely — this gets a Prisma model with extra fields and
// returns only the whitelisted ones.
interface RawSubmission {
  id: string;
  status: string;
  score: number | null;
  risk_band: string | null;
  wallet_address: string;
  repo_url: string;
  demo_url: string | null;
  proof_hash: string | null;
  eas_attestation_uid: string | null;
  tx_hash_approval: string | null;
  tx_hash_claim: string | null;
  created_at: Date;
  updated_at: Date;
  proof_checks: Array<{
    check_name: string;
    passed: boolean;
    points_awarded: number;
    max_points: number;
  }>;
  quest: {
    id: string;
    title: string;
    description: string;
    reward_amount: string;
    badge_id: bigint | string;
    min_score: number;
  };
  user?: {
    github_login: string | null;
    github_avatar_url: string | null;
    github_profile_url: string | null;
  } | null;
}

export function toPublicProof(s: RawSubmission): PublicProof {
  return {
    id: s.id,
    status: s.status,
    score: s.score ?? 0,
    risk_band: s.risk_band ?? "UNKNOWN",
    wallet_address: s.wallet_address,
    github_login: s.user?.github_login ?? null,
    github_avatar_url: s.user?.github_avatar_url ?? null,
    github_profile_url: s.user?.github_profile_url ?? null,
    repo_url: s.repo_url,
    demo_url: s.demo_url,
    proof_hash: s.proof_hash,
    eas_attestation_uid: s.eas_attestation_uid,
    tx_hash_approval: s.tx_hash_approval,
    tx_hash_claim: s.tx_hash_claim,
    approved_at: s.status === "APPROVED_ONCHAIN" || s.status === "CLAIMING" || s.status === "CLAIMED"
      ? s.updated_at.toISOString()
      : null,
    claimed_at: s.status === "CLAIMED" ? s.updated_at.toISOString() : null,
    quest: {
      id: s.quest.id,
      title: s.quest.title,
      description: s.quest.description,
      reward_amount: s.quest.reward_amount,
      badge_id: String(s.quest.badge_id),
      min_score: s.quest.min_score,
    },
    proof_checks: s.proof_checks.map((c) => ({
      check_name: c.check_name,
      passed: c.passed,
      points_awarded: c.points_awarded,
      max_points: c.max_points,
    })),
  };
}
