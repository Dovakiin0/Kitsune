import { hianime } from "@/lib/hianime";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const date = searchParams.get("date");
  const formattedDate = date
    ? new Date(date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  try {
    const data = await hianime.getEstimatedSchedule(formattedDate);
    return Response.json({ data });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "something went wrong" }, { status: 500 });
  }
}
