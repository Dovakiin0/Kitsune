export async function GET() {
  return Response.json({ status: "up and running" }, { status: 200 });
}
