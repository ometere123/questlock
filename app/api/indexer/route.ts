import { NextRequest, NextResponse } from "next/server";
import { indexContractEvents } from "@/lib/event-indexer";

// POST /api/indexer — manually trigger event indexer
// Can be called from a cron job or from the admin dashboard
export async function POST(req: NextRequest) {
  // Simple secret-based auth so it's not openly callable
  const secret = req.headers.get("x-indexer-secret");
  if (process.env.INDEXER_SECRET && secret !== process.env.INDEXER_SECRET) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const result = await indexContractEvents();
    return NextResponse.json({
      scanned: result.scanned.toString(),
      inserted: result.inserted,
    });
  } catch (err) {
    console.error("[api/indexer]", err);
    return NextResponse.json({ error: "Indexer failed." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
