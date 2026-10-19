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

const SUB_LANG_MAP: Record<string, string> = {
  en: "English", eng: "English", enm: "English",
  es: "Spanish", spa: "Spanish", "es-419": "Spanish (Latin America)",
  pt: "Portuguese", por: "Portuguese", "pt-br": "Portuguese (Brazil)",
  fr: "French", fre: "French", fra: "French",
  de: "German", deu: "German", ger: "German",
  it: "Italian", ita: "Italian",
  ru: "Russian", rus: "Russian",
  ar: "Arabic", ara: "Arabic",
  ja: "Japanese", jpn: "Japanese",
  ko: "Korean", kor: "Korean",
  zh: "Chinese", chi: "Chinese", zho: "Chinese",
  hi: "Hindi", hin: "Hindi",
  id: "Indonesian", ind: "Indonesian",
  ms: "Malay", may: "Malay",
  th: "Thai", tha: "Thai",
  vi: "Vietnamese", vie: "Vietnamese",
  tr: "Turkish", tur: "Turkish",
  bn: "Bengali", ben: "Bengali",
  fa: "Persian", per: "Persian",
  pl: "Polish", pol: "Polish",
  sw: "Swahili", swa: "Swahili",
};

function resolveSubLabel(sub: any, fileUrl: string): string {
  const raw = (sub?.language || sub?.label || sub?.title || sub?.name || sub?.lang || sub?.srclang || "").trim();
  if (raw) {
    const rawLower = raw.toLowerCase();
    if (SUB_LANG_MAP[rawLower]) return SUB_LANG_MAP[rawLower];
    const prefix = rawLower.split(/[\s-_]/)[0];
    if (SUB_LANG_MAP[prefix] && raw.length <= 6) return SUB_LANG_MAP[prefix];
    return raw;
  }
  const match = fileUrl.match(/(?:^|[_/-])(en|eng|es|spa|pt|por|fr|fre|fra|de|deu|ger|it|ita|ru|rus|ar|ara|ja|jpn|ko|kor|zh|chi|hi|id|ms|th|vi|tr|bn|fa|pl|sw)(?:[_.-]|$)/i);
  if (match) {
    const code = match[1].toLowerCase();
    if (SUB_LANG_MAP[code]) return SUB_LANG_MAP[code];
  }
  return "English";
}

  const rawSubtitles = [
    ...(Array.isArray(data?.subtitles) ? data.subtitles : []),
    ...playableStreams.flatMap((s) =>
      Array.isArray(s.subtitles) ? s.subtitles : [],
    ),
  ];

  const seenSubKeys = new Set<string>();
  const rawParsedSubtitles: Track[] = [];
  for (const sub of rawSubtitles) {
    const subUrl = sub?.file || sub?.url;
    if (!subUrl) continue;
    if ((sub as any)?.kind === "thumbnails" || subUrl.includes("thumbnails")) continue;
    const pathKey = subUrl.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    if (seenSubKeys.has(pathKey)) continue;
    seenSubKeys.add(pathKey);
    const label = resolveSubLabel(sub, subUrl);
    rawParsedSubtitles.push({
      lang: label,
      url: subUrl,
      default: Boolean(sub.default),
    });
  }

  const labelCounts: Record<string, number> = {};
  for (const s of rawParsedSubtitles) {
    labelCounts[s.lang] = (labelCounts[s.lang] || 0) + 1;
  }
  const labelIndex: Record<string, number> = {};
  const subtitles: Track[] = rawParsedSubtitles.map((s) => {
    if (labelCounts[s.lang] > 1) {
      labelIndex[s.lang] = (labelIndex[s.lang] || 0) + 1;
      return { ...s, lang: `${s.lang} ${labelIndex[s.lang]}` };
    }
    return s;
  });

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
