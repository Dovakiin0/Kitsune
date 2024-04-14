import { NEWS, Topics } from "@consumet/extensions";
import { NextResponse } from "next/server";

const ann = new NEWS.ANN();

export async function GET(req: Request) {
  const news = await ann.fetchNewsFeeds(Topics.ANIME);
  return NextResponse.json(news, { status: 200 });
}

export const revalidate = 18000;
