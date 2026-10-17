import { CACHE_HEADERS, fetchMediaPage } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("per_page") || searchParams.get("perPage")) || 20;

    const data = await fetchMediaPage({
      page,
      perPage,
      status: "NOT_YET_RELEASED",
      sort: ["POPULARITY_DESC"],
    });
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { page: 1, perPage: 20, total: 0, hasNextPage: false, results: [], error: error?.message },
      { status: 500 },
    );
  }
}
