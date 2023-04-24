import { NextResponse } from "next/server";
import Parser from "rss-parser";
const parser = new Parser();

export async function GET(req: Request) {
  const RSS_URI =
    "https://www.animenewsnetwork.com/newsroom/rss.xml?ann-edition=w";
  let feed = await parser.parseURL(RSS_URI);

  return NextResponse.json(feed);
}
