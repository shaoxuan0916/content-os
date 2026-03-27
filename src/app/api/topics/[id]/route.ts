import { NextRequest, NextResponse } from "next/server";
import { getTopicDetail } from "@/server/topics/queries";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const topic = await getTopicDetail(id);

    if (!topic) {
      return NextResponse.json({ ok: false, error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, topic });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown topic error" },
      { status: 500 }
    );
  }
}
