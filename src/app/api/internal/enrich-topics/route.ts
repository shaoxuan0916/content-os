import { NextRequest, NextResponse } from "next/server";
import { enrichTopics } from "@/server/enrichment/service";
import { assertInternalRequest } from "@/server/utils/security";

export async function POST(request: NextRequest) {
  try {
    await assertInternalRequest();
    const body = (await request.json().catch(() => ({}))) as { topicId?: string; force?: boolean };
    const result = await enrichTopics({
      topicId: body.topicId,
      force: Boolean(body.force)
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown enrichment error" },
      { status: 500 }
    );
  }
}
