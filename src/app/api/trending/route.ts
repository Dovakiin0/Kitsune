import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const URI = "https://123anime.to/";
    const data = await fetch(URI);
    if (data.ok) {
      const doc = await data.text();
      const $ = cheerio.load(doc);
      const animeData: any = [];
      $("#trending-home .swiper-container .swiper-wrapper .swiper-slide").each(
        function() {
          const position = $(this)
            .find(".number")
            .children("span")
            .text()
            .trim();
          const poster = $(this).find("img").data("src");
          const title = $(this).find(".film-title").text().trim();
          const episodeId = title
            .replaceAll(" ", "-")
            .replaceAll(":", "")
            .replaceAll("(", "")
            .replaceAll(")", "")
            .toLowerCase();
          animeData.push({ position, image: poster, title, episodeId });
        }
      );

      return NextResponse.json(animeData);
    }
    return NextResponse.error();
  } catch (error) {
    return NextResponse.json(error);
  }
}
