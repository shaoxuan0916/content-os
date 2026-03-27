import { NextRequest, NextResponse } from "next/server";
import { setTopicFeedback } from "@/server/topics/queries";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = (await request.json()) as { action: "favorite" | "used" | "ignored" };
    const { id } = await params;
    const result = await setTopicFeedback(id, body.action);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown feedback error" },
      { status: 500 }
    );
  }
}
