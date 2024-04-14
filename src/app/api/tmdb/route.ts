import { NextRequest, NextResponse } from "next/server";
import { TMDB_URI } from "@/utils/constants";

const API = {
  search: TMDB_URI + "/search/tv?query=",
  logo: TMDB_URI + "/tv",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const res = await fetch(API.search + searchParams.get("query"), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_KEY}`,
      accept: "application/json",
    },
  });

  let infoData = await res.json();
  infoData.results = infoData.results.filter(
    (data: any) => data.original_language === "ja",
  );
  if (infoData.results.length <= 0)
    return NextResponse.json(
      { message: "Empty", result: { logos: [] } },
      { status: 404 },
    );
  const result = await getTMDBLogo(infoData.results[0].id);
  return NextResponse.json({ result }, { status: 200 });
}

async function getTMDBLogo(id: number) {
  const res = await fetch(`${API.logo}/${id}/images`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_KEY}`,
      accept: "application/json",
    },
  });
  const infoData = await res.json();
  return infoData;
}

export const revalidate = 18000;
