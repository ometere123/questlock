import { NextRequest, NextResponse } from "next/server";
import { indexContractEvents } from "@/lib/event-indexer";

// /api/indexer
// Two authorised callers:
//   1. Manual admin call: header `x-indexer-secret` matches INDEXER_SECRET.
//   2. Vercel Cron (GET with `?key=cron`): header `x-vercel-cron: 1` is set
//      by Vercel on cron-originated requests, plus presence of the literal
//      `key=cron` query param. We don't need a real secret in the URL because
//      the `x-vercel-cron` header is only set by Vercel's edge.
function authorise(req: NextRequest): boolean {
  const header = req.headers.get("x-indexer-secret");
  if (process.env.INDEXER_SECRET && header === process.env.INDEXER_SECRET) return true;
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const keyParam = req.nextUrl.searchParams.get("key");
  if (isVercelCron && keyParam === "cron") return true;
  return false;
}

async function run(req: NextRequest) {
  if (!authorise(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
    const result = await indexContractEvents();
    return NextResponse.json({
      ok: true,
      scanned: result.scanned.toString(),
      inserted: result.inserted,
    });
  } catch (err) {
    console.error("[api/indexer]", err);
    return NextResponse.json({ error: "Indexer failed." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
