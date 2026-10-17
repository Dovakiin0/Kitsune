import anivexaWorker from "@/lib/anivexa/index.js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  const currentUrl = new URL(req.url);
  const targetUrl = new URL(`/episodes/${slug.join("/")}${currentUrl.search}`, req.url);
  return anivexaWorker.fetch(new Request(targetUrl.toString(), { headers: req.headers }), {});
}
