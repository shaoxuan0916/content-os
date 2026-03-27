import { NextRequest, NextResponse } from "next/server";
import { generatePromptPackage } from "@/server/prompt-packages/service";
import { assertInternalRequest } from "@/server/utils/security";

export async function POST(request: NextRequest) {
  try {
    await assertInternalRequest();
    const body = (await request.json()) as { topicId: string; templateId?: string; templateKey?: string };
    const result = await generatePromptPackage(body);
    return NextResponse.json({ ok: true, package: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown package generation error" },
      { status: 500 }
    );
  }
}
