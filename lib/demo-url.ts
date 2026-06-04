export interface DemoUrlResult {
  passed: boolean;
  status?: number;
  reason?: string;
}

const TIMEOUT_MS = 10_000;
const BLOCKED_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^0\.0\.0\.0/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

export async function checkDemoUrl(url: string): Promise<DemoUrlResult> {
  if (!url || url.trim() === "") {
    return { passed: false, reason: "Demo URL is empty." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { passed: false, reason: "Demo URL is not a valid URL." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { passed: false, reason: "Demo URL must use http or https." };
  }

  const hostname = parsed.hostname;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(hostname)) {
      return { passed: false, reason: "Demo URL points to a private/local address." };
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "QuestLock-Proof-Checker/1.0" },
    });

    clearTimeout(timeoutId);

    if (!res.ok && res.status >= 400) {
      return {
        passed: false,
        status: res.status,
        reason: `Demo URL returned HTTP ${res.status}.`,
      };
    }

    const text = await res.text();
    if (!text || text.trim().length < 100) {
      return {
        passed: false,
        status: res.status,
        reason: "Demo URL loaded but page appears to be empty.",
      };
    }

    return { passed: true, status: res.status };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return { passed: false, reason: "Demo URL timed out after 10 seconds." };
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { passed: false, reason: `Demo URL unreachable: ${msg}` };
  }
}
