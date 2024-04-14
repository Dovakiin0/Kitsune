import { ANIME } from "@consumet/extensions";
import { NextRequest, NextResponse } from "next/server";

const gogo = new ANIME.Gogoanime();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const info = await gogo.fetchAnimeInfo(params.id);
  const pattern = /\/([^/]+)$/;
  let match = info.url?.match(pattern);
  let id;
  if (match) {
    id = match[1];
  }
  let infoData = { ...info, id };
  return NextResponse.json(infoData);
}

export const revalidate = 18000;
