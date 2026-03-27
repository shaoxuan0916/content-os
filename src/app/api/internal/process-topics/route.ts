import { NextRequest, NextResponse } from "next/server";
import { processTopics } from "@/server/clustering/service";
import { assertInternalRequest } from "@/server/utils/security";

export async function POST(request: NextRequest) {
  try {
    await assertInternalRequest();
    const body = (await request.json().catch(() => ({}))) as { reset?: boolean };
    const result = await processTopics({ reset: Boolean(body.reset) });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown processing error" },
      { status: 500 }
    );
  }
}
