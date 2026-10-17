import providerWorker from "@/lib/providers/index.js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const targetUrl = new URL(`/map/${id}`, req.url);
  return providerWorker.fetch(new Request(targetUrl.toString(), { headers: req.headers }), {});
}
