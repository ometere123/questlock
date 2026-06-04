export interface GitHubRepoData {
  owner: string;
  repo: string;
  exists: boolean;
  ownerLogin: string;
  isForked: boolean;
  isEmpty: boolean;
  pushedAt: string | null;
  updatedAt: string | null;
  defaultBranch: string;
  commitCountAfterStart: number;
  hasReadme: boolean;
  readmeCharCount: number;
  hasFrontendFiles: boolean;
  hasContractFiles: boolean;
  error?: string;
}

export interface CommitInfo {
  sha: string;
  date: string;
}

const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.trim().replace(/\.git$/, "");
    const match = cleaned.match(
      /github\.com[/:]([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

export function normaliseGitHubUrl(url: string): string | null {
  const parsed = parseGitHubUrl(url);
  if (!parsed) return null;
  return `https://github.com/${parsed.owner}/${parsed.repo}`;
}

async function apiGet(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  const data = await res.json();
  return { ok: true, status: res.status, data };
}

export async function fetchRepoData(
  owner: string,
  repo: string,
  questStartTime: Date,
  submittedGithubUsername: string
): Promise<GitHubRepoData> {
  const base: GitHubRepoData = {
    owner,
    repo,
    exists: false,
    ownerLogin: "",
    isForked: false,
    isEmpty: false,
    pushedAt: null,
    updatedAt: null,
    defaultBranch: "main",
    commitCountAfterStart: 0,
    hasReadme: false,
    readmeCharCount: 0,
    hasFrontendFiles: false,
    hasContractFiles: false,
  };

  // Fetch repo metadata
  const repoRes = await apiGet(`/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
    base.error =
      repoRes.status === 404
        ? "Repository not found or is private."
        : `GitHub API error: ${repoRes.status}`;
    return base;
  }

  const repoData = repoRes.data as Record<string, unknown>;
  base.exists = true;
  base.ownerLogin = (repoData.owner as Record<string, string>)?.login || "";
  base.isForked = Boolean(repoData.fork);
  base.isEmpty = Boolean(repoData.size === 0);
  base.pushedAt = repoData.pushed_at as string | null;
  base.updatedAt = repoData.updated_at as string | null;
  base.defaultBranch = (repoData.default_branch as string) || "main";

  // Check owner matches submitted username (case-insensitive)
  if (base.ownerLogin.toLowerCase() !== submittedGithubUsername.toLowerCase()) {
    base.error = `Repository owner (${base.ownerLogin}) does not match submitted GitHub username (${submittedGithubUsername}).`;
  }

  // Fetch commits after quest start
  const since = questStartTime.toISOString();
  const commitsRes = await apiGet(
    `/repos/${owner}/${repo}/commits?since=${since}&per_page=100`
  );
  if (commitsRes.ok) {
    const commits = commitsRes.data as unknown[];
    base.commitCountAfterStart = Array.isArray(commits) ? commits.length : 0;
  }

  // Fetch README
  const readmeRes = await apiGet(`/repos/${owner}/${repo}/readme`);
  if (readmeRes.ok) {
    base.hasReadme = true;
    const readmeData = readmeRes.data as Record<string, string>;
    if (readmeData.content) {
      try {
        const decoded = Buffer.from(readmeData.content, "base64").toString("utf-8");
        // Count visible (non-whitespace) characters
        base.readmeCharCount = decoded.replace(/\s+/g, " ").trim().length;
      } catch {
        base.readmeCharCount = 0;
      }
    }
  }

  // Fetch file tree
  const treeRes = await apiGet(
    `/repos/${owner}/${repo}/git/trees/${base.defaultBranch}?recursive=1`
  );
  if (treeRes.ok) {
    const treeData = treeRes.data as { tree: Array<{ path: string }> };
    const paths = (treeData.tree || []).map((f) => f.path.toLowerCase());

    const frontendIndicators = [
      "package.json",
      "src/",
      "pages/",
      "components/",
      "app/",
      "index.html",
      "index.js",
      "index.ts",
    ];
    base.hasFrontendFiles = frontendIndicators.some((indicator) =>
      paths.some((p) => p === indicator || p.startsWith(indicator))
    );

    const contractIndicators = [
      "contracts/",
      "contract/",
      ".sol",
      "hardhat.config",
      "foundry.toml",
      "truffle-config",
      "server/",
      "backend/",
      "api/",
    ];
    base.hasContractFiles = contractIndicators.some((indicator) =>
      paths.some((p) => p.endsWith(indicator) || p.includes(indicator))
    );
  }

  return base;
}
