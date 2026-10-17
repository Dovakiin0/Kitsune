const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

export function canExtractVidplay(url) {
  return /play\.echovideo\.ru\/embed-[01]\//i.test(String(url));
}

export async function extractVidplay(embedUrl, { fetchImpl = fetch, userAgent = DEFAULT_USER_AGENT } = {}) {
  const url = new URL(String(embedUrl));
  const match = url.pathname.match(/^\/(embed-[01])\/([^/]+)$/i);
  const type = match?.[1];
  const id = match?.[2];
  if (!id) throw new Error(`Cannot extract Vidplay id from ${embedUrl}`);
  const endpoint = new URL(`/${type}/getSources`, url.origin);
  endpoint.searchParams.set("id", id);
  const response = await fetchImpl(endpoint, {
    headers: {
      "User-Agent": userAgent,
      "Referer": embedUrl,
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) throw new Error(`Vidplay sources HTTP ${response.status}`);
  const data = await response.json();
  const sources = Array.isArray(data?.sources)
    ? data.sources.map((item) => typeof item === "string" ? item : item?.file ?? item?.url).filter(Boolean)
    : typeof data?.sources === "string" ? [data.sources] : [];
  if (!sources.length) throw new Error("Vidplay response has no sources");
  return sources;
}
