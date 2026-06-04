# QuestLock

> Rewards should follow proof, not farming.

QuestLock is a deterministic proof-powered quest platform on Base Sepolia. Users submit GitHub project proof, pass objective checks, receive a public EAS attestation, and claim rewards gaslessly.

---

## Live deployment (Base Sepolia)

| Contract | Address |
|---|---|
| QuestLockCore | `0xCCe52216B17096235c070ce85F5C4fFBbf9E782C` |
| QuestRewardToken | `0x154250cc3253b4C7a0f1bfe0eCc26792c81b3054` |
| QuestBadge | `0x1010F4fB73b2DCb4b2bD43D87E0210cb6a00bBAe` |
| EAS Contract | `0x4200000000000000000000000000000000000021` |
| EAS Schema UID | `0x3c9b890e57a3887a0766fe0bf74df896e9551d7b173b3113e3363149156940a6` |

## Architecture

```
User submits GitHub proof
  → Frontend validates form + wallet
  → Backend fetches GitHub + demo URL data
  → Deterministic proof engine scores (100 pts, 70 to pass)
  → Anti-farm checks (duplicate repo, demo URL, wallet)
  → proofHash created + EAS attestation issued
  → Verifier wallet calls submitAndApprove on QuestLockCore (atomic)
  → User clicks "Claim Reward (Gasless)"
  → Verifier wallet calls claimRewardFor (user pays no gas)
  → ERC-20 reward transferred + ERC-1155 badge minted
  → Profile updates
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Wallet | Privy + wagmi + viem |
| Backend | Next.js API routes |
| Database | Supabase Postgres + Prisma |
| Contracts | Solidity 0.8.28 + Hardhat 3 + OpenZeppelin 5 |
| Network | Base Sepolia (Chain ID 84532) |
| Attestation | EAS (Ethereum Attestation Service) |
| Gasless claim | Verifier wallet calls `claimRewardFor` on user's behalf |
| Proof source | GitHub REST API |

## Smart Contracts

| Contract | Purpose |
|---|---|
| `QuestLockCore` | Quest creation, atomic submit+approve, gasless claim, role-gated admin |
| `QuestRewardToken` | ERC-20 QUEST token (testnet reward) |
| `QuestBadge` | ERC-1155 soulbound achievement badges |

### Roles

| Role | Purpose |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Emergency control, role management |
| `QUEST_CREATOR_ROLE` | Create quests on QuestLockCore |
| `VERIFIER_ROLE` | Backend wallet that approves submissions + claims for users |
| `PAUSER_ROLE` | Pause quests in emergency |

### Key functions

- `createQuest(...)` — admin creates a quest with reward, deadline, min score
- `submitProofHash(questId, proofHash)` — public, user submits own proof hash
- `submitProofHashFor(questId, user, proofHash)` — verifier submits on behalf
- `submitAndApprove(questId, user, proofHash, attestationUID, score)` — atomic verifier call: submits + approves in one tx (used by backend)
- `approveSubmission(...)` / `rejectSubmission(...)` — verifier review
- `claimReward(questId)` — public, user claims their own reward
- `claimRewardFor(questId, user)` — verifier claims on behalf (gasless UX)

## Backend Services (lib/)

| Service | Responsibility |
|---|---|
| `github.ts` | GitHub repo metadata, commits, README, file tree |
| `demo-url.ts` | Demo URL load check with timeout + private IP blocking |
| `scoring.ts` | 10-check deterministic scoring engine |
| `antifarm.ts` | Duplicate detection, risk band assignment |
| `proof-hash.ts` | Deterministic proof hash for onchain commitment |
| `eas.ts` | EAS attestation creation (pure ethers, no SDK lock-in) |
| `approval.ts` | Verifier wallet calls `submitAndApprove` |
| `event-indexer.ts` | Syncs onchain events to `contract_events` table |
| `logger.ts` | System log writer |

## Frontend Pages

| Route | Purpose |
|---|---|
| `/` | Landing — proof-powered quests explainer |
| `/quests` | Quest marketplace |
| `/quests/[id]` | Quest detail + submit proof form |
| `/submit/[questId]` | Real-time proof status, score breakdown, claim button |
| `/me` | User profile — completed quests, rewards, badges, attestations, tx links |
| `/ops-ql` | Admin dashboard — create quests, list submissions (gated to ADMIN_WALLET_ADDRESS) |
| `/ops-ql/submissions/[id]` | Admin per-submission inspection — proof checks, failure reasons, all tx hashes |

## API Routes

| Endpoint | Purpose |
|---|---|
| `GET /api/quests` | List active quests |
| `GET /api/quests/[id]` | Single quest detail |
| `POST /api/proof/submit` | Submit proof → score → attest → approve (full pipeline) |
| `GET /api/proof/status/[id]` | Poll submission status |
| `POST /api/relay/claim` | Verifier-signed gasless claim |
| `GET /api/submissions?wallet=` | User's submission history |
| `GET /api/admin/quests` | Admin quest list |
| `GET /api/admin/submissions` | Admin submission list |
| `GET /api/ops-ql/submissions/[id]` | Admin submission detail |
| `POST /api/indexer` | Manually trigger event indexer (needs `x-indexer-secret`) |
| `GET /api/health` | Public health check — env audit + DB ping + RPC ping, returns 200/503 |
| `GET /api/ops-ql/system-status` | Admin-only system panel feed (env, indexer, submission counts, recent logs) |

## v1.1 proof engine hardening

- New `lib/retry.ts` (exponential backoff, retryable-status whitelist) used by both the GitHub fetcher and the demo-URL probe. Transient `429`, `408`, `425`, `5xx`, timeouts and socket errors are retried up to 2 times before giving up.
- `lib/github.ts` now captures: fork status, default branch, primary language, file count and max directory depth, package manager (`npm` / `pnpm` / `yarn` / `bun`), README section-heading count, and crucially **commit authorship** — how many of the post-start commits are attributed to the submitting GitHub user (login, name or email heuristic).
- Frontend / contract detection expanded to a regex set covering Next / Vite / Svelte / Nuxt configs, `*.tsx`, `*.sol`, Hardhat / Foundry / Truffle configs, `server/`, `api/`, `prisma/`, plus Go/Rust/Java backend signals.
- Scoring (`lib/scoring.ts`) keeps the same **100-point ceiling** and the same 10 check names so existing data is still comparable. What changes:
  - `commits_after_start` now fails if every post-start commit is unattributable to the submitting user (typical fork-without-work pattern).
  - All failure-reason copy got crisper — for example, `frontend_files` now lists the patterns it looked for.
  - Demo URL details include the retry attempt count when a retry occurred.
- Soft `warnings[]` channel: signals that should inform but not zero a check (e.g. "Repository is a fork.") flow through scoring → API response → UI without affecting the score.
- Tests: 5 new tests for `lib/retry.ts` and 7 new tests for `lib/scoring.ts` covering happy path, fork warnings, unattributed commits, duplicate gate, demo failure surfacing.

## v1.1 manual review / appeals queue

- New `submission_appeals` table with one-appeal-per-submission constraint. Lifecycle: `PENDING → PROCESSING → APPROVED | REJECTED | APPROVE_FAILED` (the last is retryable).
- Failed-proof view (`/submit/[questId]?submissionId=…`) now shows an "Request review" CTA only to the submitting wallet. After submission the same panel shows the appeal status + admin notes.
- Admin review queue at **`/ops-ql/appeals`** lists every appeal with quest title, submitter wallet/GitHub, original score vs minimum, the user's appeal reason, the original failure reasons, repo + demo links, and an inline link to the full submission detail.
- **Approve** runs `lib/appeal-approve.ts`:
  1. Re-uses the existing `proof_hash` if present, otherwise mints a fresh deterministic hash.
  2. Issues an EAS attestation tagged `riskBand = "MANUAL_REVIEW"` so the public certificate is transparent about the override.
  3. Calls the existing `submitAndApprove(questId, user, proofHash, attestationUID, score)` via the verifier wallet — same path v1 uses. **No contract redeploy was required.**
  4. The onchain score is lifted to `max(score, minScore)` to clear the contract's score floor; the actual deterministic score remains in the EAS attestation.
  5. Updates the submission to `APPROVED_ONCHAIN` with `risk_band = "MANUAL_REVIEW"` so the existing claim button appears for the user.
- **Reject** marks the appeal closed without touching onchain state.
- **Known limitation** (per spec): the existing contract has no path to flip an onchain `REJECTED` submission into `APPROVED`. In v1 the verifier never calls `rejectSubmission` for failed offchain proofs (failures terminate before going onchain), so this affects nothing today. If a future change starts rejecting onchain we will need a contract update.
- API:
  - `POST /api/appeals` (user, rate-limited 2/min) — body `{ submissionId, walletAddress, reason }`
  - `GET  /api/appeals?wallet=` — user's own appeals
  - `GET  /api/ops-ql/appeals` — admin queue
  - `POST /api/ops-ql/appeals/[id]/approve|reject` — admin actions

## v1.1 sponsor / creator quest requests

- `quest_requests` table holds offchain submissions from sponsors with the lifecycle: `PENDING_REVIEW → APPROVED → PUBLISHING → PUBLISHED`. Branches: `REJECTED`, `PUBLISH_FAILED` (retryable).
- Public form at **`/create`** lets any connected wallet propose a quest. Sponsors can revisit `/create` to see their own requests, statuses and rejection reasons.
- Admin review queue at **`/ops-ql/quest-requests`** (gated to `ADMIN_WALLET_ADDRESS`). Two-step admin flow:
  1. **Approve** offchain — no gas spent.
  2. **Publish onchain** — separate explicit click, calls `QuestLockCore.createQuest` via the deployer wallet (which holds `QUEST_CREATOR_ROLE`), parses the `QuestCreated` event for the new `onchainQuestId`, inserts a `quests` row tied to that id, and marks the request `PUBLISHED`.
- Publish failures land in `PUBLISH_FAILED` with the error captured in `publish_error`; admin can retry without re-submitting.
- API:
  - `POST /api/quest-requests` (public, rate-limited 3/min per wallet)
  - `GET  /api/quest-requests?wallet=` (sponsor's own list)
  - `GET  /api/ops-ql/quest-requests` (admin list)
  - `POST /api/ops-ql/quest-requests/[id]/approve|reject|publish` (admin actions)
- Random users cannot publish quests directly in v1.1 — only admin approval + admin publish creates onchain quests.

## v1.1 public proof / certificate pages

- `/proof/[submissionId]` is a public, shareable certificate page. No auth required.
- Only submissions in `ATTESTED`, `APPROVED_ONCHAIN`, `CLAIMING`, or `CLAIMED` are visible — failed and in-progress submissions 404.
- The whitelist of exposed fields lives in `lib/public-proof.ts` (`toPublicProof`) — explanation, raw failure reasons, and any other private signal is never serialised into the public payload.
- The page renders quest title + subject (GitHub login if linked, else short wallet), score, risk band, badge, repo + demo links, EAS attestation, approval tx, claim tx, proof hash and per-check pass/fail.
- API: `GET /api/proof/public/[id]` mirrors the same data with the same whitelist for machine-readable use.
- OpenGraph metadata is generated per-proof so the link previews nicely on Twitter / Telegram / Slack.

## v1.1 GitHub account linking

- New columns on `users`: `github_id`, `github_login`, `github_avatar_url`, `github_profile_url`, `github_connected_at` (unique on id + login).
- OAuth flow: `POST /api/auth/github/start` → user redirected to GitHub → `GET /api/auth/github/callback` → user redirected to `/me?github=...`.
- `GET /api/auth/github/status?wallet=` reports link state. `POST /api/auth/github/disconnect` clears it.
- State token is an HMAC-signed `body.signature` carrying `{wallet, nonce, exp}`; signed with `INDEXER_SECRET` (or `VERIFIER_PRIVATE_KEY` as a fallback). Tokens expire after 10 minutes.
- Access tokens are exchanged server-side and discarded immediately after the `/user` lookup — they never reach the browser.
- Proof submission requires a linked GitHub account and rejects submissions whose repository owner does not exactly match the linked login.
- Need a GitHub OAuth App: create one at https://github.com/settings/developers with Authorization callback URL set to `${NEXT_PUBLIC_APP_URL}/api/auth/github/callback`. Fill `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_REDIRECT_URI` in `.env`.

## v1.1 ops hardening

- `lib/env.ts` — `requireEnv()` / `auditEnv()` validate required vs optional env vars at startup. Use `requireEnv` in any code path that needs a server secret.
- `lib/rate-limit.ts` — in-process token-bucket limiter wired into `/api/proof/submit` and `/api/relay/claim`. **Best-effort:** state is held in module memory and resets on server restart / serverless cold start. Swap to a Supabase-backed store if you need durability.
- `/api/health` — JSON status with env audit, DB ping latency, RPC tip block. Returns HTTP 503 if any required env var is missing or DB/RPC is unreachable.
- `/ops-ql` System tab — env audit, indexer status (last block, last event, total events), live submission counts grouped by status, last 25 system log lines.

## Proof Checks (100 pts, 70 to pass)

| Check | Points |
|---|---|
| Repository exists and is public | 10 |
| Owner matches submitted GitHub username | 10 |
| Repository updated after quest start | 10 |
| 3+ commits after quest start | 15 |
| README file present | 10 |
| README has 500+ characters | 10 |
| Frontend files detected | 10 |
| Contract/backend files detected | 10 |
| Demo URL loads | 10 |
| Not previously submitted | 5 |

## Submission Status Lifecycle

`SUBMITTED → FETCHING_PROOF → EVALUATING → PASSED → ATTESTING → ATTESTED → APPROVING_ONCHAIN → APPROVED_ONCHAIN → CLAIMING → CLAIMED`

Failure paths land in `FAILED`, `REJECTED`, or `CLAIM_FAILED`.

## Environment Setup

```bash
cp .env.example .env
# Fill all values (see docs/DEPLOYMENT.md)
npm install
npx prisma generate
npx prisma migrate dev --name init
```

## Build commands

```bash
npm run dev              # Dev server
npm run build            # Production build (passes ✓)
npm run typecheck        # tsc --noEmit (passes ✓)
npm run lint             # Same as typecheck
npm run test:contracts   # Hardhat unit tests (18 passing ✓)
```

## Base Sepolia Deployment

```bash
npm run contracts:compile
npm run contracts:deploy           # Deploy all three contracts
npm run contracts:grant-roles      # Grant VERIFIER_ROLE
npm run contracts:seed-quest       # Fund + create sample quest
```

## Known Limitations (v1)

- GitHub proof only (no Twitter/X, Discord, LMS)
- Base Sepolia testnet only (no mainnet, no multi-chain)
- Deterministic scoring only (no AI/LLM evaluation)
- No real KYC or identity verification
- No manual appeal queue (admin can reject/approve via contract directly)
- Demo URL check requires a publicly accessible URL
- Gasless claim implemented via verifier-signed `claimRewardFor` (not Gelato Relay — Gelato SDK lodash-es ESM conflict was unresolvable; user still pays no gas)

## Future Improvements

- Discord proof, Twitter/X proof, LMS proof
- Multi-chain reward support
- Seasonal quests
- Creator-created quests with sponsor dashboards
- Reputation levels
- Cross-chain claim
- Manual appeal queue
- True Gelato Relay integration once SDK is ESM-stable

## Brand System

Warm proof infrastructure palette:
- `#22150C` Bighorn Sheep — primary dark
- `#432C1A` Night Brown — secondary dark
- `#5B4535` Brown Derby — muted surface
- `#816550` Bear Creek — metadata/muted
- `#A98C75` Cafe Americaine — borders/inputs
- `#834A1F` Milk Chocolate — action accent (CTA, claim)
- `#D3CBC1` Ashen Tan — light background

Typography: Plus Jakarta Sans.

---

QuestLock v1 · Base Sepolia · Proof over hype.
