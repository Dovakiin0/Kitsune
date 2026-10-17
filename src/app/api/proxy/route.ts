import { CORS_PNA_HEADERS, handleHlsProxyRequest } from "@/lib/hls-proxy";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleHlsProxyRequest(request.url, "/api/proxy");
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_PNA_HEADERS,
  });
}
