import { NextResponse } from "next/server";
import { TMDB_URI } from "@/utils/constants";

const API = {
  search: TMDB_URI + "/search/tv?query=",
  logo: TMDB_URI + "/tv",
};

export async function GET(req: Request) {
  let query = new URL(req.url);
  if (!query.searchParams.has("query")) {
    return NextResponse.json({ message: "No Query Provided" });
  }
  const res = await fetch(API.search + query.searchParams.get("query"), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_KEY}`,
      accept: "application/json",
    },
  });

  const infoData = await res.json();
  if (infoData.results.length <= 0) return;
  const result = await getTMDBLogo(infoData.results[0].id);
  return NextResponse.json({ result });
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
