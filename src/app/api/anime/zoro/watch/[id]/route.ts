import { ANIME } from "@consumet/extensions";
import { NextRequest, NextResponse } from "next/server";

const zoro = new ANIME.Zoro();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = new URL(req.url).searchParams;
  const ep = searchParams.get("ep");
  const id = params.id + `$episode$${ep}`;
  const episode = await zoro.fetchEpisodeSources(id);
  return NextResponse.json(episode);
}

export const revalidate = 0