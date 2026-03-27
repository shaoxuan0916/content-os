import { NextRequest, NextResponse } from "next/server";
import type { FeedbackAction } from "@/server/db/types";
import { listTopics } from "@/server/topics/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const feedback = (searchParams.get("feedback") || "unreviewed") as FeedbackAction | "unreviewed";
    const topics = await listTopics({
      category: searchParams.get("category") || undefined,
      feedback
    });
    return NextResponse.json({ ok: true, topics });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown topics error" },
      { status: 500 }
    );
  }
}
