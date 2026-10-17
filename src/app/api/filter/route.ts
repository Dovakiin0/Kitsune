import { CACHE_HEADERS, fetchMediaPage } from "@/lib/anilist";
import { NextRequest, NextResponse } from "next/server";

const STATUS_MAP: Record<string, string> = {
  "FINISHED-AIRING": "FINISHED",
  FINISHED: "FINISHED",
  "CURRENTLY-AIRING": "RELEASING",
  RELEASING: "RELEASING",
  "NOT-YET-AIRED": "NOT_YET_RELEASED",
  NOT_YET_RELEASED: "NOT_YET_RELEASED",
  CANCELLED: "CANCELLED",
  HIATUS: "HIATUS",
};

const FORMAT_MAP: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV_SHORT",
  MOVIE: "MOVIE",
  SPECIAL: "SPECIAL",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "MUSIC",
};

const SEASON_MAP: Record<string, string> = {
  WINTER: "WINTER",
  SPRING: "SPRING",
  SUMMER: "SUMMER",
  FALL: "FALL",
};

const SORT_MAP: Record<string, string[]> = {
  "RECENTLY-ADDED": ["START_DATE_DESC"],
  RECENTLY_ADDED: ["START_DATE_DESC"],
  "RECENTLY-UPDATED": ["UPDATED_AT_DESC"],
  RECENTLY_UPDATED: ["UPDATED_AT_DESC"],
  SCORE: ["SCORE_DESC"],
  SCORE_DESC: ["SCORE_DESC"],
  "NAME-A-Z": ["TITLE_ROMAJI"],
  NAME_A_Z: ["TITLE_ROMAJI"],
  TITLE_ROMAJI: ["TITLE_ROMAJI"],
  "RELEASED-DATE": ["START_DATE_DESC"],
  RELEASED_DATE: ["START_DATE_DESC"],
  "MOST-WATCHED": ["POPULARITY_DESC"],
  MOST_WATCHED: ["POPULARITY_DESC"],
  POPULARITY: ["POPULARITY_DESC"],
  POPULARITY_DESC: ["POPULARITY_DESC"],
  TRENDING: ["TRENDING_DESC"],
  TRENDING_DESC: ["TRENDING_DESC"],
  FAVOURITES: ["FAVOURITES_DESC"],
  FAVOURITES_DESC: ["FAVOURITES_DESC"],
};

const GENRE_OR_TAG_MAP: Record<string, { genre?: string; tag?: string }> = {
  action: { genre: "Action" },
  adventure: { genre: "Adventure" },
  comedy: { genre: "Comedy" },
  drama: { genre: "Drama" },
  ecchi: { genre: "Ecchi" },
  fantasy: { genre: "Fantasy" },
  horror: { genre: "Horror" },
  mecha: { genre: "Mecha" },
  music: { genre: "Music" },
  mystery: { genre: "Mystery" },
  psychological: { genre: "Psychological" },
  romance: { genre: "Romance" },
  "sci-fi": { genre: "Sci-Fi" },
  scifi: { genre: "Sci-Fi" },
  "slice-of-life": { genre: "Slice of Life" },
  sports: { genre: "Sports" },
  supernatural: { genre: "Supernatural" },
  thriller: { genre: "Thriller" },
  dementia: { genre: "Psychological" },
  cars: { tag: "Cars" },
  demons: { tag: "Demons" },
  game: { tag: "Video Games" },
  harem: { tag: "Female Harem" },
  historical: { tag: "Historical" },
  isekai: { tag: "Isekai" },
  josei: { tag: "Josei" },
  kids: { tag: "Kids" },
  magic: { tag: "Magic" },
  "martial-arts": { tag: "Martial Arts" },
  military: { tag: "Military" },
  parody: { tag: "Parody" },
  police: { tag: "Police" },
  samurai: { tag: "Samurai" },
  school: { tag: "School" },
  seinen: { tag: "Seinen" },
  shoujo: { tag: "Shoujo" },
  "shoujo ai": { tag: "Yuri" },
  shounen: { tag: "Shounen" },
  "shounen ai": { tag: "Boys' Love" },
  space: { tag: "Space" },
  "super-power": { tag: "Super Power" },
  vampire: { tag: "Vampire" },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("per_page") || searchParams.get("perPage")) || 20;
    const query = (searchParams.get("query") || searchParams.get("q") || "").trim();

    const genreRaw = searchParams.get("genre") || searchParams.get("genres") || "";
    const items = genreRaw
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);

    const genre_in: string[] = [];
    const tag_in: string[] = [];

    for (const item of items) {
      const mapped = GENRE_OR_TAG_MAP[item];
      if (mapped) {
        if (mapped.genre && !genre_in.includes(mapped.genre)) genre_in.push(mapped.genre);
        if (mapped.tag && !tag_in.includes(mapped.tag)) tag_in.push(mapped.tag);
      } else {
        const titleCase = item
          .split(/[\s-]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        tag_in.push(titleCase);
      }
    }

    const rawSeason = (searchParams.get("season") || "").trim().toUpperCase();
    const season = SEASON_MAP[rawSeason] || undefined;

    const rawFormat = (searchParams.get("format") || searchParams.get("type") || "").trim().toUpperCase();
    const format = FORMAT_MAP[rawFormat] || undefined;

    const rawStatus = (searchParams.get("status") || "").trim().toUpperCase();
    const status = STATUS_MAP[rawStatus] || undefined;

    const rawSort = (searchParams.get("sort") || "").trim().toUpperCase();
    let sort = SORT_MAP[rawSort];
    if (!sort) {
      sort = query ? ["SEARCH_MATCH", "POPULARITY_DESC"] : ["POPULARITY_DESC"];
    }

    const data = await fetchMediaPage({
      page,
      perPage,
      search: query || undefined,
      genre_in: genre_in.length ? genre_in : undefined,
      tag_in: tag_in.length ? tag_in : undefined,
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
