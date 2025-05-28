import { hianime } from "@/lib/hianime";
import { AnilistMediaList } from "@/types/anilist-animes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ provider: string }> },
) {
  const params = await props.params;
  const { provider } = params;
  if (provider !== "anilist") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const body = await request.json();
  const animeList = body.animes as AnilistMediaList[];

  if (!animeList || animeList.length === 0) {
    return NextResponse.json(
      { error: "No anime list provided" },
      { status: 400 },
    );
  }

  const status = {
    anilist: {
      CURRENT: "watching",
      COMPLETED: "completed",
      PLANNING: "plan to watch",
      DROPPED: "dropped",
      PAUSED: "on hold",
      REPEATING: "watching",
    },
  } as const;

  type ProviderStatus = keyof typeof status;
  type StatusType = keyof (typeof status)[ProviderStatus];

  // loop over each items in body
  // and fetch corresponding anime from the hianime
  const mappedAnimes = [];

  for (const item of animeList) {
    for (const entry of item.entries) {
      const {
        media: { title },
      } = entry;
      if (!title || !title.english) {
        continue; // Skip if title is not available
      }
      const anime = await hianime.searchSuggestions(title.english);
      if (anime.suggestions.length > 0) {
        mappedAnimes.push({
          id: anime.suggestions[0].id,
          thumbnail: anime.suggestions[0].poster,
          title: anime.suggestions[0].name,
          status: status[provider as ProviderStatus][item.status as StatusType],
        });
      }
    }
  }

  return NextResponse.json({ animes: mappedAnimes }, { status: 200 });
}
