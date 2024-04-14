import { ANIME } from "@consumet/extensions";
import { NextRequest, NextResponse } from "next/server";

const gogo = new ANIME.Gogoanime();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const popular = await gogo.fetchTopAiring();
  return NextResponse.json(popular.results);
}

export const revalidate = 18000;
