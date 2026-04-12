import { NextResponse } from "next/server";
import { runIngestion } from "@/server/ingestion/service";
import { assertCronRequest, UnauthorizedCronRequestError } from "@/server/utils/security";

async function handleIngestion() {
  try {
    await assertCronRequest();
    const result = await runIngestion();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof UnauthorizedCronRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown ingestion error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleIngestion();
}

export async function POST() {
  return handleIngestion();
}
