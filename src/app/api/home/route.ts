import { hianime } from "@/lib/hianime";

export async function GET() {
  try {
    const data = await hianime.getHomePage();
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
