import { CACHE_HEADERS, fetchSchedule } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const date = searchParams.get("date") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("per_page") || searchParams.get("perPage")) || 25;

    const data = await fetchSchedule(date, page, perPage);
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { page: 1, perPage: 25, total: 0, hasNextPage: false, results: [], error: error?.message },
      { status: 500 },
    );
  }
}
