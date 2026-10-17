const __name = (fn, _) => fn;
import { getMedia } from '../core/anilist.js';
import { extractFlixcloud } from "../extractors/index.js";
import { buildTitleSearchQueries, buildTitles } from '../core/new-provider-utils.js';
import { get as cacheGet, set as cacheSet, isFresh as cacheIsFresh, SHOW_IDENTITY_TTL } from '../core/smartcache.js';

var BASE = "https://reanime.to";
var FLIX = "https://flixcloud.cc";
var ANIZIP2 = "https://api.ani.zip/mappings";
var UA5 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var H = { "User-Agent": UA5, Accept: "application/json, */*" };
async function searchReanime(query, genre = null) {
  const params = new URLSearchParams({ q: query, limit: 10 });
  if (genre) params.set("genre", genre);
  const data = await fetch(`${BASE}/api/v1/search?${params}`, { headers: H }).then(async (r) => {
    const _raw = await r.text();
    if (!r.ok) { const _e = new Error(`reanime search ${r.status}`); _e.rawBody = _raw; throw _e; }
    try { return JSON.parse(_raw); } catch (_pe) { _pe.rawBody = _raw; throw _pe; }
  });
  return Array.isArray(data?.results) ? data.results : [];
}
__name(searchReanime, "searchReanime");
async function fetchAnimeDetail(animeId) {
  const res = await fetch(`${BASE}/api/v1/anime/${animeId}`, { headers: H });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}
__name(fetchAnimeDetail, "fetchAnimeDetail");
// Extract AniList ID embedded in AniList CDN cover image URLs.
// e.g. https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-xxxx.jpg → 16498
function extractAnilistIdFromCover(coverImage) {
  const urls = [coverImage?.extra_large, coverImage?.large, coverImage?.medium].filter(Boolean);
  for (const url of urls) {
    const m = url.match(/anilist\.co\/.*\/bx(\d+)-/);
    if (m) return Number(m[1]);
  }
  return null;
}
__name(extractAnilistIdFromCover, "extractAnilistIdFromCover");
async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:match2:reanime:${anilistId}`;
  const cached = cacheGet(cacheKey);
  if (cacheIsFresh(cached)) return cached.data;

  const media = ctx.media ?? await getMedia(anilistId);
  const malId = media?.idMal ?? null;
  const queries = buildTitleSearchQueries(buildTitles(media, ctx.anizip), 16);
  const searchRequests = queries.map((query) => searchReanime(query));
  if (media?.genres?.includes("Hentai")) {
    searchRequests.push(...queries.map((query) => searchReanime(query, "Hentai")));
  }

  const candidates = new Map();
  await Promise.all(searchRequests.map(async (request) => {
    for (const r of await request.catch(() => [])) {
      if (r?.anime_id && !candidates.has(r.anime_id)) candidates.set(r.anime_id, r);
    }
  }));

  // Fast pass: AniList CDN cover URLs embed the AniList ID as bx{id}-*.
  // If a candidate's cover image already confirms our ID we can skip detail fetches entirely.
  for (const [id, r] of candidates) {
    const coverId = extractAnilistIdFromCover(r.cover_image);
    if (coverId && coverId === Number(anilistId)) {
      const data = {
        animeId: id,
        title: r.title?.english || r.title?.romaji || id,
        anilistId: Number(anilistId),
        malId: null,
        subbed: Number.isFinite(r.subbed) ? r.subbed : null,
        dubbed: Number.isFinite(r.dubbed) ? r.dubbed : null,
        episodesCount: Number.isFinite(r.episodes) ? r.episodes : null,
        matchType: "cover_image",
        matchScore: 1,
      };
      cacheSet(cacheKey, data, SHOW_IDENTITY_TTL);
      return data;
    }
  }

  // Fallback: fetch detail pages only for candidates that had no AniList CDN cover
  // (TMDB / MAL covers don't embed an ID we can read directly).
  const needsDetail = [...candidates.keys()].filter(
    (id) => extractAnilistIdFromCover(candidates.get(id)?.cover_image) === null
  );
  const details = await Promise.all(
    needsDetail.map(async (id) => ({ id, detail: await fetchAnimeDetail(id).catch(() => null) }))
  );

  for (const { id, detail } of details) {
    if (detail?.anilist_id && Number(detail.anilist_id) === Number(anilistId)) {
      const data = {
        animeId: id,
        title: detail.title?.english || detail.title?.romaji || candidates.get(id)?.title?.english || id,
        anilistId: Number(anilistId),
        malId: detail.mal_id || null,
        subbed: Number.isFinite(detail.subbed) ? detail.subbed : null,
        dubbed: Number.isFinite(detail.dubbed) ? detail.dubbed : null,
        episodesCount: Number.isFinite(detail.episodes) ? detail.episodes : null,
        matchType: "anilist",
        matchScore: 1,
      };
      cacheSet(cacheKey, data, SHOW_IDENTITY_TTL);
      return data;
    }
  }

  if (malId) {
    for (const { id, detail } of details) {
      const detailMal = detail?.mal_id;
      if (detailMal && Number(detailMal) === Number(malId)) {
        const data = {
          animeId: id,
          title: detail.title?.english || detail.title?.romaji || id,
          anilistId: Number(anilistId),
          malId: Number(detailMal),
          subbed: Number.isFinite(detail.subbed) ? detail.subbed : null,
          dubbed: Number.isFinite(detail.dubbed) ? detail.dubbed : null,
          episodesCount: Number.isFinite(detail.episodes) ? detail.episodes : null,
          matchType: "mal",
          matchScore: 0.9,
        };
        cacheSet(cacheKey, data, SHOW_IDENTITY_TTL);
        return data;
      }
    }
  }

  throw new Error(`No confirmed reanime match for AniList ${anilistId}`);
}
__name(resolveSeries, "resolveSeries");
async function fetchEpisodesList(animeId, limit = 2000) {
  const data = await fetch(`${BASE}/api/v1/anime/${animeId}/episodes?${new URLSearchParams({ limit })}`, { headers: H }).then(async (r) => {
    const _raw = await r.text();
    if (!r.ok) { const _e = new Error(`reanime episodes ${r.status}`); _e.rawBody = _raw; throw _e; }
    try { return JSON.parse(_raw); } catch (_pe) { _pe.rawBody = _raw; throw _pe; }
  });
  return Array.isArray(data?.data) ? data.data : [];
}
__name(fetchEpisodesList, "fetchEpisodesList");
async function fetchAnizip(anilistId) {
  return fetch(`${ANIZIP2}?anilist_id=${anilistId}`).then((r) => r.json()).catch(() => null);
}
__name(fetchAnizip, "fetchAnizip");
function mergeEpisode(anilistId, ep, meta, audio) {
  const number = ep.episode_number;
  return {
    id: `watch/reanime/${anilistId}/${audio}/reanime-${number}`,
    number,
    title: meta?.title?.en || meta?.title?.["x-jat"] || ep.title || `Episode ${number}`,
    titleJapanese: meta?.title?.ja || ep.title_japanese || null,
    titleRomanji: meta?.title?.["x-jat"] || ep.title_romanji || null,
    image: meta?.image || ep.thumbnail || null,
    airDate: meta?.airdate || ep.aired || null,
    duration: meta?.runtime ? meta.runtime * 60 : (ep.duration ? ep.duration * 60 : null),
    score: null,
    filler: ep.is_filler ?? meta?.filler ?? false,
    recap: ep.is_recap ?? false,
    description: meta?.overview || ep.description || null,
    audio
  };
}
__name(mergeEpisode, "mergeEpisode");
function json3(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
__name(json3, "json");
async function handleEpisodes3(anilistId, url) {
  const series = await resolveSeries(anilistId);
  const [reanimeEps, anizip] = await Promise.all([
    fetchEpisodesList(series.animeId),
    fetchAnizip(anilistId)
  ]);
  if (!reanimeEps.length) return json3({ error: `No reanime episodes found for AniList ID ${anilistId} (slug ${series.animeId})` }, 404);
  const episodes = reanimeEps.map((ep) => {
    const meta = anizip?.episodes?.[String(ep.episode_number)] ?? null;
    return mergeEpisode(anilistId, ep, meta, "sub");
  }).sort((a, b) => a.number - b.number);
  return json3({
    anime: series.title,
    anilistId: Number(anilistId),
    malId: series.malId,
    animeId: series.animeId,
    episodes,
    pagination: { currentPage: 1, lastPage: 1, hasNextPage: false }
  });
}
__name(handleEpisodes3, "handleEpisodes");
async function resolveStream3(anilistId, audio, ep) {
  const series = await resolveSeries(anilistId);
  const title2 = series.title;
  const slug = series.animeId;
  const order = { "HD-2": 0, "HD-1": 1 };
  const byPrio = (arr) => arr.slice().sort((a, b) => (order[a.serverName] ?? 9) - (order[b.serverName] ?? 9));
  const [watchRes, flixRes] = await Promise.allSettled([
    fetch(`${BASE}/api/watch/${slug}/${ep}`, { headers: H }).then(async (r) => {
      const _raw = await r.text();
      if (!r.ok) { const _e = new Error(`watch ${r.status}`); _e.rawBody = _raw; throw _e; }
      try { return JSON.parse(_raw); } catch (_pe) { _pe.rawBody = _raw; throw _pe; }
    }),
    fetch(`${BASE}/api/flix/${anilistId}/${ep}`, { headers: H }).then(async (r) => {
      const _raw = await r.text();
      if (!r.ok) { const _e = new Error(`flix ${r.status}`); _e.rawBody = _raw; throw _e; }
      try { return JSON.parse(_raw); } catch (_pe) { _pe.rawBody = _raw; throw _pe; }
    })
  ]);
  const watchData = watchRes.status === "fulfilled" ? watchRes.value : null;
  const flixData = flixRes.status === "fulfilled" ? flixRes.value : null;
  const links = [...watchData?.episode_links ?? []];
  if (flixData?.success && flixData?.servers) {
    const seen = new Set(links.map((s) => s["$id"]));
    for (const s of flixData.servers) {
      if (!seen.has(s["$id"])) links.push(s);
    }
  }
  const audioTypes = audio === "sub" ? ["sub", "s-sub"] : ["dub", "s-dub"];
  const servers = byPrio(links.filter((s) => audioTypes.includes(s.dataType)));
  if (!servers.length) throw Object.assign(new Error(`No ${audio} servers for "${title2}" ep ${ep}`), { status: 404 });
  const seenServers = new Set();
  const uniqueServers = servers.filter((s) => {
    const key = `${s.serverName}:${s.dataType}:${s.dataLink}`;
    if (seenServers.has(key)) return false;
    seenServers.add(key);
    return true;
  });
  const decrypted = await Promise.all(uniqueServers.map(async (server, index) => {
    try {
      const embedRes = await fetch(server.dataLink, { headers: { ...H, Referer: `${BASE}/` } });
      if (!embedRes.ok) throw new Error(`Embed fetch failed: ${embedRes.status}`);
      const stream = await extractFlixcloud(await embedRes.text(), { apiBase: FLIX, headers: H, referer: `${BASE}/` });
      return { server, stream, index };
    } catch (error) {
      return { server, error: error.message, index };
    }
  }));
  const streams = decrypted.filter((item) => item.stream?.url);
  if (!streams.length) {
    const error = decrypted.find((item) => item.error)?.error || "No decrypted streams";
    throw Object.assign(new Error(error), { status: 502 });
  }
  return { title: title2, slug, watchData, stream: streams[0].stream, server: streams[0].server.serverName, servers: uniqueServers, streams, failedServers: decrypted.filter((item) => item.error) };
}
__name(resolveStream3, "resolveStream");
async function handleWatch3(anilistId, audio, epNum, origin) {
  if (audio !== "sub" && audio !== "dub") return json3({ error: "audio must be sub or dub" }, 400);
  const ep = parseInt(epNum);
  if (isNaN(ep)) return json3({ error: `Invalid episode: ${epNum}` }, 400);
  let resolved;
  try {
    resolved = await resolveStream3(anilistId, audio, ep);
  } catch (e) {
    return json3({ error: e.message, "Raw-ERROR": e.rawBody ?? null, stack: e.stack }, e.status ?? 500);
  }
  const { title: title2, slug, watchData, stream, server, servers, streams, failedServers } = resolved;
  const seenStreamUrls = new Set();
  const cleanStreams = streams.map(({ server: source, stream: item, index }) => ({
    server: source.serverName,
    audio: source.dataType,
    index,
    url: item.url,
    type: "hls",
    embed: source.dataLink,
    key: item.key ?? null,
    playlist_key: item.playlist_key ?? item.key ?? null,
    subtitles: item.subtitles ?? [],
    thumbnails_vtt: item.thumbnails_vtt ?? null,
    video_title: item.video_title ?? null,
    intro: item.intro_chapter ?? null,
    outro: item.outro_chapter ?? null
  })).filter((item) => {
    if (seenStreamUrls.has(item.url)) return false;
    seenStreamUrls.add(item.url);
    return true;
  });
  const embeds = servers.map((s) => ({ name: s.serverName, type: s.dataType, url: s.dataLink }));
  return json3({
    anime: title2,
    slug,
    ep,
    audio,
    server,
    stream_url: stream.url,
    streams: cleanStreams,
    subtitles: stream.subtitles,
    thumbnails_vtt: stream.thumbnails_vtt,
    video_title: stream.video_title,
    intro: stream.intro_chapter,
    outro: stream.outro_chapter,
    intro_start: watchData?.intro_start ?? null,
    intro_end: watchData?.intro_end ?? null,
    outro_start: watchData?.outro_start ?? null,
    outro_end: watchData?.outro_end ?? null,
    embeds,
    allServers: servers.map((s) => ({ name: s.serverName, type: s.dataType, embed: s.dataLink })),
    failedServers: failedServers.map((s) => ({ name: s.server.serverName, type: s.server.dataType, error: s.error }))
  });
}
__name(handleWatch3, "handleWatch");
async function handleStream3(anilistId, audio, epNum) {
  if (audio !== "sub" && audio !== "dub") return json3({ error: "audio must be sub or dub" }, 400);
  const ep = parseInt(epNum);
  if (isNaN(ep)) return json3({ error: `Invalid episode: ${epNum}` }, 400);
  let resolved;
  try {
    resolved = await resolveStream3(anilistId, audio, ep);
  } catch (e) {
    return json3({ error: e.message, "Raw-ERROR": e.rawBody ?? null, stack: e.stack }, e.status ?? 500);
  }
  return new Response(null, {
    status: 302,
    headers: {
      "Location": resolved.stream.url,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
__name(handleStream3, "handleStream");
var reanime_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      let m;
      if (path === "/healthz") return json3({ status: "ok", provider: "reanime" });
      m = path.match(/^\/episodes\/(\d+)$/);
      if (m) return await handleEpisodes3(m[1], url);
      m = path.match(/^\/watch\/(\d+)\/(sub|dub)\/(\d+)$/);
      if (m) return await handleWatch3(m[1], m[2], m[3], url.origin);
      m = path.match(/^\/stream\/(\d+)\/(sub|dub)\/(\d+)$/);
      if (m) return await handleStream3(m[1], m[2], m[3]);
      return json3({ error: "Not found", routes: ["GET /episodes/:anilistId", "GET /watch/:anilistId/sub|dub/:ep", "GET /stream/:anilistId/sub|dub/:ep"] }, 404);
    } catch (err) {
      return json3({ error: err.message, "Raw-ERROR": err.rawBody ?? null, ...err.debug ? { debug: err.debug } : {}, stack: err.stack }, 500);
    }
  }
};
async function getEpisodes3(anilistId, ctx = {}) {
  const series = await resolveSeries(anilistId, ctx);
  const anizip = ctx.anizip !== void 0 ? ctx.anizip : await fetchAnizip(anilistId);
  const reanimeEps = await fetchEpisodesList(series.animeId);
  if (!reanimeEps.length) throw new Error(`No reanime episodes found for AniList ${anilistId} (slug ${series.animeId})`);

  const hasSub = series.subbed == null || series.subbed > 0;
  const dubCount = series.dubbed ?? 0;
  const sub = [], dub = [];
  for (const ep of reanimeEps) {
    const meta = anizip?.episodes?.[String(ep.episode_number)] ?? null;
    if (hasSub) sub.push(mergeEpisode(anilistId, ep, meta, "sub"));
    if (dubCount > 0 && ep.episode_number <= dubCount) dub.push(mergeEpisode(anilistId, ep, meta, "dub"));
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: { title: series.title, malId: series.malId, animeId: series.animeId },
    episodes: { sub, dub }
  };
}
__name(getEpisodes3, "getEpisodes");
export default reanime_default;
export { getEpisodes3 as getEpisodes };
