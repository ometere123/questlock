"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();

  const walletAddr = user?.wallet?.address;
  const shortAddr = walletAddr
    ? `${walletAddr.slice(0, 6)}…${walletAddr.slice(-4)}`
    : null;

  // Admin creates quests directly via /ops-ql Create Quest tab and doesn't
  // need the public sponsor "request" form. Hide the link to avoid confusion
  // between the two creation paths.
  const isAdmin = walletAddr?.toLowerCase() === "0x1f63ea74065586af0c7c48428372d88d0a89525b";

  return (
    <nav
      style={{ backgroundColor: "var(--ql-bighorn)" }}
      className="sticky top-0 z-50 border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <rect width="28" height="28" rx="6" fill="#834A1F" />
            <path
              d="M14 6C10.69 6 8 8.69 8 12v1H7v9h14v-9h-1v-1c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4v1h-8v-1c0-2.21 1.79-4 4-4zm0 7a2 2 0 110 4 2 2 0 010-4z"
              fill="#F6F1EA"
            />
          </svg>
          <span
            className="font-serif text-lg font-semibold tracking-tight"
            style={{ color: "#F6F1EA" }}
          >
            QuestLock
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/quests"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--ql-ashen)" }}
          >
            Quests
          </Link>
          {!isAdmin && (
            <Link
              href="/create"
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--ql-ashen)" }}
            >
              Create
            </Link>
          )}
          <Link
            href="/leaderboard"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--ql-ashen)" }}
          >
            Leaderboard
          </Link>
          {authenticated && (
            <>
              <Link
                href="/sponsor"
                className="text-sm font-medium"
                style={{ color: "var(--ql-ashen)" }}
              >
                Sponsor
              </Link>
              <Link
                href="/me"
                className="text-sm font-medium"
                style={{ color: "var(--ql-ashen)" }}
              >
                Profile
              </Link>
              {user?.wallet?.address?.toLowerCase() === "0x1f63ea74065586af0c7c48428372d88d0a89525b" && (
                <>
                  <Link
                    href="/ops-ql"
                    className="text-sm font-medium"
                    style={{ color: "var(--ql-cafe)" }}
                  >
                    Admin
                  </Link>
                  <Link
                    href="/ops-ql/quest-requests"
                    className="text-sm font-medium"
                    style={{ color: "var(--ql-cafe)" }}
                  >
                    Requests
                  </Link>
                  <Link
                    href="/ops-ql/appeals"
                    className="text-sm font-medium"
                    style={{ color: "var(--ql-cafe)" }}
                  >
                    Appeals
                  </Link>
                  <Link
                    href="/ops-ql/analytics"
                    className="text-sm font-medium"
                    style={{ color: "var(--ql-cafe)" }}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/ops-ql/retry"
                    className="text-sm font-medium"
                    style={{ color: "var(--ql-cafe)" }}
                  >
                    Retry
                  </Link>
                </>
              )}
            </>
          )}

          {authenticated && <NotificationBell />}

          {authenticated ? (
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-mono px-3 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--ql-ashen)",
                }}
              >
                {shortAddr}
              </span>
              <button
                onClick={logout}
                className="text-xs px-4 py-2 rounded-full font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "var(--ql-ashen)",
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="text-sm px-5 py-2 rounded-full font-medium transition-all hover:opacity-90"
              style={{
                background: "var(--ql-chocolate)",
                color: "var(--accent-foreground)",
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
