import { CACHE_HEADERS, fetchMediaPage } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

const VALID_SORTS = new Set([
  "SCORE_DESC",
  "POPULARITY_DESC",
  "TRENDING_DESC",
  "START_DATE_DESC",
  "FAVOURITES_DESC",
  "UPDATED_AT_DESC",
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("per_page") || searchParams.get("perPage")) || 20;
    const query = (searchParams.get("query") || searchParams.get("q") || "").trim();
    const genreRaw = searchParams.get("genre") || searchParams.get("genres") || "";
    const genres = genreRaw
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    const season = searchParams.get("season")?.toUpperCase() || undefined;
    const format = searchParams.get("format")?.toUpperCase() || undefined;
    const status = searchParams.get("status")?.toUpperCase() || undefined;
    const sortParam = searchParams.get("sort")?.toUpperCase();
    const sort = sortParam && VALID_SORTS.has(sortParam) ? [sortParam] : ["POPULARITY_DESC"];

    const data = await fetchMediaPage({
      page,
      perPage,
      search: query || undefined,
      genre_in: genres.length ? genres : undefined,
      season,
      format,
      status,
      sort,
    });
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { page: 1, perPage: 20, total: 0, hasNextPage: false, results: [], error: error?.message },
      { status: 500 },
    );
  }
}
