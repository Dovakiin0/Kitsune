import { CACHE_HEADERS, fetchAnimeInfo } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const animeId = Number(id);
    if (!animeId || isNaN(animeId)) {
      return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
    }

    const data = await fetchAnimeInfo(animeId);
    if (!data) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch anime info" },
      { status: 500 },
    );
  }
}
