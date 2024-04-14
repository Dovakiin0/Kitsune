import { ANIME } from "@consumet/extensions";
import { NextRequest, NextResponse } from "next/server";

const gogo = new ANIME.Gogoanime();

export async function GET(
  req: NextRequest,
  { params }: { params: { query: string } },
) {
  const search = await gogo.search(params.query);
  return NextResponse.json(search.results);
}

export const revalidate = 18000;
