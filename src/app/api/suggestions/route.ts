import { CACHE_HEADERS, fetchSuggestions } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("query") || req.nextUrl.searchParams.get("q") || "";
    const data = await fetchSuggestions(q);
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { suggestions: [], error: error?.message },
      { status: 500 },
    );
  }
}
