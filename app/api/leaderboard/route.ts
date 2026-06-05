// Public leaderboard — strictly public-safe data only.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const proofType = req.nextUrl.searchParams.get("proof_type");
  const filter: { proof_type?: string } = {};
  if (proofType) filter.proof_type = proofType;

  // Aggregate completed claims by wallet
  const rows = await prisma.submission.groupBy({
    by: ["wallet_address"],
    where: { status: "CLAIMED", ...filter },
    _count: { wallet_address: true },
    _avg: { score: true },
    orderBy: { _count: { wallet_address: "desc" } },
    take: 50,
  });

  // Pull github_login + discord_username (public-safe) for each wallet
  const wallets = rows.map((r) => r.wallet_address);
  const users = wallets.length === 0 ? [] : await prisma.user.findMany({
    where: { wallet_address: { in: wallets } },
    select: { wallet_address: true, github_login: true },
  });
  const discords = wallets.length === 0 ? [] : await prisma.discordConnection.findMany({
    where: { wallet_address: { in: wallets }, revoked_at: null },
    select: { wallet_address: true, discord_username: true },
  });
  const userMap = new Map(users.map((u) => [u.wallet_address.toLowerCase(), u]));
  const discordMap = new Map(discords.map((d) => [d.wallet_address.toLowerCase(), d]));

  const leaderboard = rows.map((r, idx) => {
    const w = r.wallet_address.toLowerCase();
    return {
      rank: idx + 1,
      wallet_short: `${r.wallet_address.slice(0, 6)}…${r.wallet_address.slice(-4)}`,
      github_login: userMap.get(w)?.github_login ?? null,
      discord_username: discordMap.get(w)?.discord_username ?? null,
      completed_quests: r._count.wallet_address,
      average_score: r._avg.score !== null
        ? Math.round((r._avg.score as number) * 10) / 10 : null,
    };
  });
  return NextResponse.json({ leaderboard });
}
