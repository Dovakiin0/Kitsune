import { ANIME } from "@consumet/extensions";
import { NextRequest, NextResponse } from "next/server";

const gogo = new ANIME.Gogoanime();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const episode = await gogo.fetchEpisodeSources(params.id);
  return NextResponse.json(episode);
}

export const revalidate = 18000;
