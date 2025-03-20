import { hianime } from "@/lib/hianime";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") as string;
    const data = await hianime.searchSuggestions(q);
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
