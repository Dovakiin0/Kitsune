import { CACHE_HEADERS, fetchSpotlight } from "@/lib/anilist";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await fetchSpotlight();
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { results: [], error: error?.message || "Failed to fetch spotlight" },
      { status: 500 },
    );
  }
}
