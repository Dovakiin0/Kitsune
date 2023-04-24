import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const URI = "https://zoro.to/home";
    const data = await fetch(URI);
    if (data.ok) {
      const doc = await data.text();
      const $ = cheerio.load(doc);
      const animeData: any = [];
      $("#slider .swiper-wrapper .swiper-slide").each(function() {
        const spotlight = $(this).find(".desi-sub-text").text().trim();
        const img = $(this)
          .find(".deslide-cover-img")
          .children("img")
          .data("src");
        const title = $(this).find(".desi-head-title").text().trim();
        const desc = $(this).find(".desi-description").text().trim();
        animeData.push({
          title,
          image: img,
          description: desc,
          spotlight,
        });
      });

      return NextResponse.json(animeData);
    }
    return NextResponse.error();
  } catch (error) {
    return NextResponse.json(error);
  }
}
