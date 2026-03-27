import { NextResponse } from "next/server";
import { runIngestion } from "@/server/ingestion/service";
import { assertInternalRequest } from "@/server/utils/security";

export async function POST() {
  try {
    await assertInternalRequest();
    const result = await runIngestion();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown ingestion error" },
      { status: 500 }
    );
  }
}
