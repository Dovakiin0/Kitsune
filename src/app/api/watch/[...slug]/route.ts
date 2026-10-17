import { CACHE_HEADERS, fetchWatchSources } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  try {
    const { slug } = await context.params;
    // Expected format: [provider, anilistId, category, epNum]
    const anilistId = Number(slug?.[1] || slug?.[0]) || 0;
    const epNum = Number(slug?.[3] || slug?.[2] || 1) || 1;

    const data = await fetchWatchSources(anilistId, epNum);
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      {
        streams: [],
        subtitles: [],
        intro: { start: 0, end: 0 },
        outro: { start: 0, end: 0 },
        error: error?.message,
      },
      { status: 200 },
    );
  }
}
