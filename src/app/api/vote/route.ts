import { NextResponse } from "next/server";
import { VoteBodySchema } from "@/schemas";
import { voteForWork } from "@/lib/gallery-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let input: unknown;
  try { input = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = VoteBodySchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Valid workId required" }, { status: 400 });
  try {
    const votesCount = await voteForWork(parsed.data.workId);
    if (votesCount === null) return NextResponse.json({ error: "Work not found" }, { status: 404 });
    return NextResponse.json({ ok: true, votesCount });
  } catch (error) {
    console.error("Gallery vote failed", error);
    return NextResponse.json({ error: "Vote could not be saved" }, { status: 500 });
  }
}
