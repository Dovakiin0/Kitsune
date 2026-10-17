import { GET_EPISODE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { resolveApiEndpoint } from "@/lib/local-proxy";
import { IEpisodeSource, Source, Track } from "@/types/episodes";
import { StreamSourceItem, WatchSourcesResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const getEpisodeData = async (
  episodeId: string,
): Promise<IEpisodeSource> => {
  const cleanId = episodeId.startsWith("/") ? episodeId : `/${episodeId}`;
  // Only query /watch/... endpoints; plain numeric fallback IDs have no provider stream
  if (!cleanId.startsWith("/watch/")) {
    return {
      headers: { Referer: "" },
      subtitles: [],
      intro: { start: 0, end: 0 },
      outro: { start: 0, end: 0 },
      sources: [],
      anilistID: 0,
      malID: 0,
    };
  }

  const endpointUrl = await resolveApiEndpoint(cleanId);
  const res = endpointUrl.startsWith("http")
    ? await fetch(endpointUrl).then(async (r) => ({ data: (await r.json()) as WatchSourcesResponse }))
    : await api.get<WatchSourcesResponse>(cleanId);
  const data = res.data;

  const parts = cleanId.split("/");
  const anilistId = Number(parts[2] || parts[3] || data?.anilistId) || 0;

  const rawStreams: StreamSourceItem[] = Array.isArray(data?.streams) ? data.streams : [];
  // Filter to playable HLS/MP4 streams (exclude embed-only or DASH-only unless HLS present)
  const playableStreams = rawStreams
    .filter(
      (s) =>
        s?.url &&
        s.isActive !== false &&
        (s.type === "hls" ||
          s.type === "m3u8" ||
          s.type === "mp4" ||
          s.url.includes(".m3u8")),
    )
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  const sources: Source[] = playableStreams.map((s) => ({
    url: s.url,
    type: s.type || "hls",
    server: s.server,
    referer: s.referer || s.headers?.Referer || s.headers?.referer || "",
    headers: s.headers,
    playlist_key: s.playlist_key || s.key,
  }));

  const rawSubtitles = [
    ...(Array.isArray(data?.subtitles) ? data.subtitles : []),
    ...playableStreams.flatMap((s) =>
      Array.isArray(s.subtitles) ? s.subtitles : [],
    ),
  ];

  const seenUrls = new Set<string>();
  const subtitles: Track[] = [];
  for (const sub of rawSubtitles) {
    const subUrl = sub?.file || sub?.url;
    if (!subUrl || seenUrls.has(subUrl)) continue;
    if ((sub as any)?.kind === "thumbnails" || subUrl.includes("thumbnails")) continue;
    seenUrls.add(subUrl);
    subtitles.push({
      lang: sub.label || sub.lang || sub.srclang || "English",
      url: subUrl,
      default: Boolean(sub.default),
    });
  }

  const firstReferer =
    sources[0]?.referer ||
    data?.headers?.Referer ||
    data?.headers?.referer ||
    "";

  return {
    headers: { Referer: firstReferer },
    subtitles,
    intro: data?.intro || { start: 0, end: 0 },
    outro: data?.outro || { start: 0, end: 0 },
    sources,
    anilistID: anilistId,
    malID: 0,
  };
};

export const useGetEpisodeData = (episodeId: string, enabled: boolean = true) => {
  return useQuery({
    queryFn: () => getEpisodeData(episodeId),
    queryKey: [GET_EPISODE_DATA, episodeId],
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!episodeId && enabled,
  });
};
