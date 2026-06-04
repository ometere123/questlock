import type { GitHubRepoData } from "./github";
import type { DemoUrlResult } from "./demo-url";

export interface ScoringRubric {
  repo_exists: number;
  owner_matches: number;
  repo_updated_after_start: number;
  commits_after_start: number;
  readme_exists: number;
  readme_length: number;
  frontend_files: number;
  contract_files: number;
  demo_url_loads: number;
  not_previously_submitted: number;
}

export const DEFAULT_RUBRIC: ScoringRubric = {
  repo_exists: 10,
  owner_matches: 10,
  repo_updated_after_start: 10,
  commits_after_start: 15,
  readme_exists: 10,
  readme_length: 10,
  frontend_files: 10,
  contract_files: 10,
  demo_url_loads: 10,
  not_previously_submitted: 5,
};

export interface ProofCheckResult {
  check_name: string;
  passed: boolean;
  points_awarded: number;
  max_points: number;
  details: string;
}

export interface ScoringResult {
  score: number;
  checks: ProofCheckResult[];
  failureReasons: string[];
  passed: boolean;
}

export function scoreProof(
  repoData: GitHubRepoData,
  demoResult: DemoUrlResult,
  isDuplicate: boolean,
  questStartTime: Date,
  rubric: Partial<ScoringRubric> = {},
  minScore = 70
): ScoringResult {
  const r = { ...DEFAULT_RUBRIC, ...rubric };
  const checks: ProofCheckResult[] = [];
  const failureReasons: string[] = [];

  function check(
    name: string,
    passed: boolean,
    maxPts: number,
    passDetail: string,
    failDetail: string
  ) {
    const pts = passed ? maxPts : 0;
    checks.push({
      check_name: name,
      passed,
      points_awarded: pts,
      max_points: maxPts,
      details: passed ? passDetail : failDetail,
    });
    if (!passed && maxPts > 0) {
      failureReasons.push(failDetail);
    }
  }

  // 1. Repo exists
  check(
    "repo_exists",
    repoData.exists,
    r.repo_exists,
    "Repository found on GitHub.",
    repoData.error || "Repository not found or is private."
  );

  // 2. Owner matches
  const ownerMatches =
    repoData.exists &&
    repoData.ownerLogin.toLowerCase() === repoData.owner.toLowerCase();
  check(
    "owner_matches",
    ownerMatches,
    r.owner_matches,
    `Repository owner matches submitted GitHub username.`,
    `Repository owner (${repoData.ownerLogin}) does not match submitted username.`
  );

  // 3. Repo updated after quest start
  const repoUpdated =
    repoData.exists &&
    repoData.pushedAt != null &&
    new Date(repoData.pushedAt) > questStartTime;
  check(
    "repo_updated_after_start",
    repoUpdated,
    r.repo_updated_after_start,
    "Repository was updated after quest started.",
    "Repository has not been updated since the quest started."
  );

  // 4. At least 3 commits after start
  const enoughCommits = repoData.exists && repoData.commitCountAfterStart >= 3;
  check(
    "commits_after_start",
    enoughCommits,
    r.commits_after_start,
    `${repoData.commitCountAfterStart} commits found after quest start.`,
    `Only ${repoData.commitCountAfterStart} commits found after quest start (need at least 3).`
  );

  // 5. README exists
  check(
    "readme_exists",
    repoData.hasReadme,
    r.readme_exists,
    "README file found.",
    "No README file found in repository."
  );

  // 6. README length >= 500 chars
  const readmeLong = repoData.hasReadme && repoData.readmeCharCount >= 500;
  check(
    "readme_length",
    readmeLong,
    r.readme_length,
    `README has ${repoData.readmeCharCount} characters (minimum 500).`,
    `README too short: ${repoData.readmeCharCount} characters (need at least 500).`
  );

  // 7. Frontend files
  check(
    "frontend_files",
    repoData.hasFrontendFiles,
    r.frontend_files,
    "Frontend files detected (package.json, components, pages, etc.).",
    "No frontend files detected."
  );

  // 8. Contract/backend files
  check(
    "contract_files",
    repoData.hasContractFiles,
    r.contract_files,
    "Contract or backend files detected.",
    "No contract or backend files detected."
  );

  // 9. Demo URL loads
  check(
    "demo_url_loads",
    demoResult.passed,
    r.demo_url_loads,
    "Demo URL loaded successfully.",
    demoResult.reason || "Demo URL did not load."
  );

  // 10. Not previously submitted
  check(
    "not_previously_submitted",
    !isDuplicate,
    r.not_previously_submitted,
    "Repository not previously submitted for this quest.",
    "Repository has already been submitted for this quest by another user."
  );

  const score = checks.reduce((sum, c) => sum + c.points_awarded, 0);
  const passed = score >= minScore && !isDuplicate && repoData.exists;

  return { score, checks, failureReasons, passed };
}
