export const CORS_PNA_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Private-Network": "true",
};

const FLIX_IMAGE_SEGMENT_XOR_KEY = Uint8Array.from([
  157, 42, 241, 71, 179, 142, 92, 112,
  166, 25, 228, 59, 216, 98, 15, 197,
]);

export function decryptFlixManifest(bodyBuffer: Buffer, playlistKey?: string): string {
  const trimmed = bodyBuffer.toString("utf8").trim();
  if (trimmed.startsWith("#EXTM3U") || !playlistKey) return trimmed;

  try {
    const key = Buffer.from(playlistKey, "base64");
    const payload = Buffer.from(trimmed, "base64");
    const out = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      out[i] = payload[i] ^ key[i % key.length];
    }
    const text = out.toString("utf8").trim();
    if (text.startsWith("#EXTM3U")) return text;
  } catch {
    // Fall back to raw text if decryption fails
  }
  return trimmed;
}

export function unwrapFlixImageSegment(bodyBuffer: Buffer): {
  body: Buffer;
  unwrapped: boolean;
} {
  let offset = 0;
  let needsXor = false;

  const isWebp =
    bodyBuffer.length > 12 &&
    bodyBuffer[0] === 0x52 &&
    bodyBuffer[1] === 0x49 &&
    bodyBuffer[2] === 0x46 &&
    bodyBuffer[3] === 0x46 &&
    bodyBuffer[8] === 0x57 &&
    bodyBuffer[9] === 0x45 &&
    bodyBuffer[10] === 0x42 &&
    bodyBuffer[11] === 0x50;

  const isPng =
    bodyBuffer.length > 8 &&
    bodyBuffer[0] === 0x89 &&
    bodyBuffer[1] === 0x50 &&
    bodyBuffer[2] === 0x4e &&
    bodyBuffer[3] === 0x47 &&
    bodyBuffer[4] === 0x0d &&
    bodyBuffer[5] === 0x0a &&
    bodyBuffer[6] === 0x1a &&
    bodyBuffer[7] === 0x0a;

  if (isWebp) {
    offset = 12;
    needsXor = bodyBuffer[offset] !== 0x47;
  } else if (isPng) {
    offset = 8;
    needsXor = bodyBuffer[offset] !== 0x47;
  }

  if (!offset) return { body: bodyBuffer, unwrapped: false };

  const out = Buffer.from(bodyBuffer.subarray(offset));
  if (needsXor) {
    for (let i = 0; i < out.length; i++) {
      out[i] ^= FLIX_IMAGE_SEGMENT_XOR_KEY[i % FLIX_IMAGE_SEGMENT_XOR_KEY.length];
    }
  }
  return { body: out, unwrapped: true };
}

export async function handleHlsProxyRequest(
  requestUrl: string,
  proxyPathPrefix: string = "/api/proxy",
): Promise<Response> {
  const parsedReqUrl = new URL(requestUrl, "http://localhost");
  const searchParams = parsedReqUrl.searchParams;

  let targetUrl = searchParams.get("url") || "";
  if (!targetUrl) {
    const urlMatch = requestUrl.match(/[?&]url=([^&]+(?:&(?!(?:referer|headers|playlist_key)=)[^&]+)*)/);
    if (urlMatch?.[1]) {
      try {
        targetUrl = decodeURIComponent(urlMatch[1]);
      } catch {
        targetUrl = urlMatch[1];
      }
    }
  }

  const refererParam = searchParams.get("referer") || "";
  const headersParam = searchParams.get("headers") || "";
  const playlistKey = searchParams.get("playlist_key") || "";

  if (!targetUrl) {
    return new Response("Missing url parameter", {
      status: 400,
      headers: CORS_PNA_HEADERS,
    });
  }

  try {
    const targetUri = new URL(targetUrl);
    const origin = targetUri.origin;

    let customHeaders: Record<string, string> = {};
    if (headersParam) {
      try {
        const parsed = JSON.parse(headersParam);
        if (parsed && typeof parsed === "object") {
          customHeaders = parsed;
        }
      } catch {
        // Ignore malformed headers JSON
      }
    }

    let referer =
      refererParam ||
      customHeaders.Referer ||
      customHeaders.referer ||
      "";
    if (
      !referer ||
      referer.includes("localhost") ||
      referer.includes("127.0.0.1") ||
      referer.includes("0.0.0.0")
    ) {
      referer = `${origin}/`;
    }

    let refererOrigin = origin;
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      refererOrigin = origin;
    }

    const baseHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      ...customHeaders,
    };

    const fetchHeaders: Record<string, string> = {
      ...baseHeaders,
      Referer: referer,
      Origin: customHeaders.Origin || customHeaders.origin || refererOrigin,
    };

    let response = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!response.ok && (response.status === 404 || response.status === 403)) {
      response = await fetch(targetUrl, {
        headers: baseHeaders,
        redirect: "follow",
      });
    }

    if (!response.ok) {
      return new Response(
        `Proxy target returned status: ${response.status} ${response.statusText}`,
        {
          status: response.status,
          headers: CORS_PNA_HEADERS,
        },
      );
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const urlWithoutQuery = targetUrl.split("?")[0];
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    const isM3u8Candidate =
      Boolean(playlistKey) ||
      urlWithoutQuery.endsWith(".m3u8") ||
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegurl") ||
      contentType.includes("vnd.apple.mpegurl");

    const buildProxyUrl = (absUrl: string, includePlaylistKey: boolean = false) => {
      const params = new URLSearchParams();
      params.set("url", absUrl);
      if (referer) params.set("referer", referer);
      if (headersParam) params.set("headers", headersParam);
      if (includePlaylistKey && playlistKey) params.set("playlist_key", playlistKey);
      return `${proxyPathPrefix}?${params.toString()}`;
    };

    if (isM3u8Candidate) {
      const manifestText = decryptFlixManifest(rawBuffer, playlistKey || undefined);

      if (manifestText.startsWith("#EXTM3U") || urlWithoutQuery.endsWith(".m3u8")) {
        const baseUrl = urlWithoutQuery.substring(
          0,
          urlWithoutQuery.lastIndexOf("/") + 1,
        );

        const rewrittenManifest = manifestText
          .split(/\r?\n/)
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) {
              if (
                trimmed.startsWith("#EXT-X-KEY:") ||
                trimmed.startsWith("#EXT-X-MAP:") ||
                trimmed.startsWith("#EXT-X-MEDIA:")
              ) {
                return trimmed.replace(/URI="([^"]+)"/g, (_match, uriStr) => {
                  const absoluteUri = uriStr.startsWith("http")
                    ? uriStr
                    : new URL(uriStr, baseUrl).toString();
                  const isChildManifest =
                    absoluteUri.split("?")[0].endsWith(".m3u8") ||
                    trimmed.startsWith("#EXT-X-MEDIA:");
                  return `URI="${buildProxyUrl(absoluteUri, isChildManifest)}"`;
                });
              }
              return line;
            }

            let segmentUrl = trimmed;
            if (
              !segmentUrl.startsWith("http://") &&
              !segmentUrl.startsWith("https://")
            ) {
              if (segmentUrl.startsWith("/")) {
                segmentUrl = `${origin}${segmentUrl}`;
              } else {
                segmentUrl = new URL(segmentUrl, baseUrl).toString();
              }
            }

            const isChildPlaylist =
              segmentUrl.split("?")[0].endsWith(".m3u8") ||
              manifestText.includes("#EXT-X-STREAM-INF");
            return buildProxyUrl(segmentUrl, isChildPlaylist);
          })
          .join("\n");

        return new Response(rewrittenManifest, {
          status: 200,
          headers: {
            ...CORS_PNA_HEADERS,
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache",
          },
        });
      }
    }

    const { body: finalBody, unwrapped } = unwrapFlixImageSegment(rawBuffer);

    let finalContentType = unwrapped ? "video/mp2t" : contentType;
    if (urlWithoutQuery.endsWith(".vtt") || contentType.includes("vtt")) {
      finalContentType = "text/vtt; charset=utf-8";
    } else if (urlWithoutQuery.endsWith(".srt")) {
      finalContentType = "text/plain; charset=utf-8";
    } else if (urlWithoutQuery.endsWith(".ass")) {
      finalContentType = "text/x-ssa; charset=utf-8";
    } else if (!finalContentType) {
      finalContentType = "application/octet-stream";
    }

    return new Response(new Uint8Array(finalBody), {
      status: 200,
      headers: {
        ...CORS_PNA_HEADERS,
        "Content-Type": finalContentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return new Response(
      `Proxy server error: ${error?.message || "Unknown"}`,
      {
        status: 500,
        headers: CORS_PNA_HEADERS,
      },
    );
  }
}
