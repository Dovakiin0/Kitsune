import { hianime } from "@/lib/hianime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get("animeEpisodeId") as string;
    // const server = searchParams.get("server") as
    //   | "hd-1"
    //   | "hd-2"
    //   | "megacloud"
    //   | "streamsb"
    //   | "streamtape";
    const category = searchParams.get("category") as "sub" | "dub" | "raw";

    const data = await hianime.getEpisodeSources(
      decodeURIComponent(episodeId),
      undefined,
      category,
    );

    return Response.json({ data });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
