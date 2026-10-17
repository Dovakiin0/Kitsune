import { CORS_PNA_HEADERS } from "@/lib/hls-proxy";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      mode: "server",
      version: "2.3.0",
      providers: [
        "mkissa",
        "reanime",
        "anikoto",
        "animegg",
        "animenosub",
        "anizone",
        "aniwaves",
        "senshi",
        "kaa",
        "animedunya",
        "animeonsen",
        "anipm",
      ],
    },
    { headers: CORS_PNA_HEADERS },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_PNA_HEADERS,
  });
}
