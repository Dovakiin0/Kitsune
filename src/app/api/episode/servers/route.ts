import { hianime } from "@/lib/hianime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const animeEpisodeId = searchParams.get("animeEpisodeId") as string;

    const data = await hianime.getEpisodeServers(
      decodeURIComponent(animeEpisodeId),
    );
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
