import { hianime } from "@/lib/hianime";
import { HiAnime } from "aniwatch";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get("animeEpisodeId") as string;
    const server = searchParams.get("server") as HiAnime.AnimeServers;
    const category = searchParams.get("category") as "sub" | "dub" | "raw";

    const data = await hianime.getEpisodeSources(
      decodeURIComponent(episodeId),
      server,
      category,
    );
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
