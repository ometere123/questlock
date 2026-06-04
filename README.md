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
