import { NextResponse } from "next/server";
import { listPublicArticles } from "@/server/articles/queries";

export const dynamic = "force-dynamic";

const newsCacheHeaders = {
  "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=43200"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceSlug = searchParams.get("source") || undefined;
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "24", 10);

  try {
    const result = await listPublicArticles({
      sourceSlug,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 24
    });

    return NextResponse.json(result, { headers: newsCacheHeaders });
  } catch (error) {
    return NextResponse.json(
      { articles: [], hasMore: false, error: error instanceof Error ? error.message : "Unable to load articles." },
      { status: 500 }
    );
  }
}
