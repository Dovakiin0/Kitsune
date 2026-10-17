import { getMedia } from "../core/anilist.js";
import {
  buildTitles,
  buildTitleSearchQueries,
  decodeEntities,
  episodeMeta,
  expectedCount,
  getPrequelOffset,
  json,
  titleIdentityScore,
} from "../core/new-provider-utils.js";
import { get, set, isFresh, SHOW_IDENTITY_TTL } from "../core/smartcache.js";

const BASE = "https://anizone.to";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUrl(value) {
  return String(value || "").replace(/\\+\//g, "/");
}

function decodeJsonArgument(raw) {
  if (!raw) return null;
  const marker = "\x01U\x01";
  let value = String(raw).replace(/\\\\u([0-9a-fA-F]{4})/g, `${marker}$1`);
  value = value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  value = value.replace(/\x01U\x01([0-9a-fA-F]{4})/g, "\\u$1");
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function jsonArgument(html, name) {
  const pattern = new RegExp(`${escapeRegex(name)}\\s*:\\s*JSON\\.parse\\('((?:[^'\\\\]|\\\\.)*)'\\)`, "i");
  return decodeJsonArgument(String(html).match(pattern)?.[1]);
}

function playerData(html) {
  const match = String(html).match(/vidstackPlayer\s*\(\s*JSON\.parse\('((?:[^'\\]|\\.)*)'\)\s*\)/i);
  return decodeJsonArgument(match?.[1]);
}

function responseCookies(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const value = response.headers.get("set-cookie");
  return value ? [value] : [];
}

function mergeCookies(jar, values) {
  for (const value of values) {
    const match = String(value).match(/^\s*([^=;\s]+)=([^;]*)/);
    if (match) jar.set(match[1], match[2]);
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      ...options.headers,
    },
  });
  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`AniZone HTTP ${response.status}: ${url}`);
    error.rawBody = raw;
    throw error;
  }
  return { raw, cookies: responseCookies(response) };
}

async function fetchPage(path) {
  return request(`${BASE}${path}`, {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Referer": `${BASE}/`,
    },
  });
}

function pickTitle(titles) {
  return titles?.["1"] || titles?.["5"] || titles?.["8"] || Object.values(titles || {})[0] || "";
}

function titleValues(item) {
  return [...new Set([item?.main_title, ...Object.values(item?.title_list || {})].filter(Boolean))];
}

function formatName(value) {
  const type = String(value || "").toLowerCase();
  if (type.includes("special")) return "special";
  if (type.includes("movie")) return "movie";
  if (type.includes("ova")) return "ova";
  if (type.includes("web") || type.includes("ona")) return "ona";
  if (type.includes("tv")) return "tv";
  return "";
}

function expectedFormat(value) {
  const format = String(value || "").toUpperCase();
  if (format === "TV" || format === "TV_SHORT") return "tv";
  if (format === "MOVIE") return "movie";
  if (format === "OVA") return "ova";
  if (format === "ONA") return "ona";
  if (format === "SPECIAL") return "special";
  return "";
}

function searchQueries(titles) {
  return buildTitleSearchQueries(titles, 18);
}

function parseSearchItems(html) {
  const items = jsonArgument(html, "items");
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => /^[a-z0-9-]+$/i.test(String(item?.slug || "")))
    .map((item) => ({
      slug: String(item.slug),
      title: pickTitle(item.title_list) || item.main_title || "",
      titles: titleValues(item),
      type: formatName(item.type),
      year: Number(item.start_year) || null,
      episodeCount: Number(item.episode_count) || 0,
    }))
    .filter((item) => item.title);
}

async function search(query) {
  const { raw } = await fetchPage(`/anime?search=${encodeURIComponent(query)}`);
  return parseSearchItems(raw);
}

function candidateTitleScore(titles, candidate) {
  return titleIdentityScore(titles, [...candidate.titles, candidate.slug.replace(/-/g, " ")]);
}

function coverageScore(candidate, expected, status) {
  if (!expected || expected < 1) return 0.5;
  if (candidate.episodeCount < 1) return 0;
  if (status !== "FINISHED") return 1;
  if (expected < 6) return 1;
  const needed = Math.ceil(expected * 0.8);
  return Math.min(1, candidate.episodeCount / needed);
}

function validateCandidate(candidate, media, titles, expected) {
  const titleScore = candidateTitleScore(titles, candidate);
  const format = expectedFormat(media?.format);
  const year = Number(media?.startDate?.year ?? media?.seasonYear ?? 0) || null;
  const primaryTitles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const partOrdinal = Math.max(0, ...primaryTitles.map(ordinal));
  const partMapping = expected === 1
    && format === "special"
    && candidate.type === "special"
    && year
    && candidate.year === year
    && partOrdinal >= 2
    && candidate.episodeCount === partOrdinal
    && titleScore >= 0.65;
  if (titleScore < 0.68 && !partMapping) return null;
  if (format && candidate.type && format !== candidate.type) return null;
  if (year && candidate.year && year !== candidate.year) return null;
  const coverage = coverageScore(candidate, expected, media?.status);
  if (expected >= 6 && coverage < 0.8) return null;
  const score = titleScore * 0.72 + (format && candidate.type === format ? 0.14 : 0.07) + (year && candidate.year === year ? 0.1 : 0.04) + coverage * 0.04;
  const exactEpisodeCount = expected > 0 && candidate.episodeCount === expected;
  return { ...candidate, titleScore, coverage, score, exactEpisodeCount, partOrdinal: partMapping ? partOrdinal : 0 };
}

async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:match2:anizone:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  const expected = expectedCount(media, ctx.anizip);
  const discovered = new Map();
  await Promise.all(searchQueries(titles).map(async (query) => {
    try {
      for (const candidate of await search(query)) if (!discovered.has(candidate.slug)) discovered.set(candidate.slug, candidate);
    } catch {}
  }));
  const valid = [...discovered.values()]
    .map((candidate) => validateCandidate(candidate, media, titles, expected))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || Number(right.exactEpisodeCount) - Number(left.exactEpisodeCount));
  const selected = valid[0];
  const runnerUp = valid[1];
  const exactCountResolvesTie = selected?.exactEpisodeCount
    && runnerUp
    && !runnerUp.exactEpisodeCount
    && selected.titleScore >= runnerUp.titleScore - 0.02;
  if (!selected || (selected.score < 0.82 && !selected.partOrdinal) || (runnerUp && selected.score - runnerUp.score < 0.08 && !exactCountResolvesTie)) {
    throw new Error(`AniZone match not confident for AniList ${anilistId}`);
  }
  const data = {
    slug: selected.slug,
    title: selected.title,
    matchScore: selected.titleScore,
    score: selected.score,
    type: selected.type,
    year: selected.year,
    episodeCount: selected.episodeCount,
    partOrdinal: selected.partOrdinal,
  };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}

function snapshot(html) {
  const match = [...String(html).matchAll(/wire:snapshot="([^"]*)"/gi)]
    .find((item) => item[1].includes("pages.anime-detail"));
  return match ? decodeEntities(match[1]) : "";
}

function cursor(html) {
  return String(html).match(/nextCursor:\s*'([^']+)'/i)?.[1] || null;
}

function hasMore(html) {
  return /hasMore:\s*true/i.test(String(html));
}

function csrf(html) {
  return String(html).match(/csrf-token"\s+content="([^"]+)"/i)?.[1] || "";
}

function seconds(value) {
  const parts = String(value || "").match(/^(\d+):(\d{1,2})$/);
  if (!parts) return null;
  return Number(parts[1]) * 60 + Number(parts[2]);
}

function episodeNumber(item) {
  const direct = Number(item?.slug);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const fromUrl = normalizeUrl(item?.url).match(/\/(\d+)\/?$/)?.[1];
  const number = Number(fromUrl);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseEpisodes(items) {
  const seen = new Set();
  return items
    .map((item) => {
      const number = episodeNumber(item);
      if (!number || seen.has(number)) return null;
      seen.add(number);
      return {
        number,
        sourceNumber: number,
        title: pickTitle(item.title_list) || `Episode ${number}`,
        duration: seconds(item.duration),
        description: item.summary || null,
        image: normalizeUrl(item.snapshot) || null,
        airDate: item.air_date || null,
        hasSub: Number(item.videos_count) > 0,
        hasDub: false,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.number - right.number);
}

function initialPage(html, cookies) {
  const items = jsonArgument(html, "items");
  const data = {
    items: Array.isArray(items) ? items : [],
    snapshot: snapshot(html),
    cursor: cursor(html),
    hasMore: hasMore(html),
    csrf: csrf(html),
    cookies: mergeCookies(new Map(), cookies),
  };
  if (!data.items.length || !data.snapshot || !data.csrf) {
    const error = new Error("AniZone page payload not found");
    error.rawBody = html;
    throw error;
  }
  return data;
}

async function loadPage(state, slug) {
  const response = await request(`${BASE}/livewire/update`, {
    method: "POST",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "X-Livewire": "",
      "X-CSRF-TOKEN": state.csrf,
      "X-Requested-With": "XMLHttpRequest",
      "Origin": BASE,
      "Referer": `${BASE}/anime/${slug}`,
      "Cookie": cookieHeader(state.cookies),
    },
    body: JSON.stringify({
      components: [{
        snapshot: state.snapshot,
        updates: {},
        calls: [{ path: "", method: "loadPage", params: [state.cursor] }],
      }],
    }),
  });
  let payload;
  try {
    payload = JSON.parse(response.raw);
  } catch {
    const error = new Error("AniZone returned invalid Livewire JSON");
    error.rawBody = response.raw;
    throw error;
  }
  const component = payload?.components?.[0];
  const dispatch = component?.effects?.dispatches?.find((item) => item?.name === "items-loaded");
  if (!component?.snapshot || !dispatch?.params || !Array.isArray(dispatch.params.items)) {
    const error = new Error("AniZone page continuation payload not found");
    error.rawBody = response.raw;
    throw error;
  }
  return {
    items: dispatch.params.items,
    snapshot: component.snapshot,
    cursor: dispatch.params.nextCursor || null,
    hasMore: Boolean(dispatch.params.hasMore),
    csrf: state.csrf,
    cookies: mergeCookies(state.cookies, response.cookies),
  };
}

async function scrapeSeries(slug, limit, maxPages) {
  const initial = await fetchPage(`/anime/${slug}`);
  let state = initialPage(initial.raw, initial.cookies);
  const items = [...state.items];
  let pages = 1;
  while (state.hasMore && state.cursor && items.length < limit && pages < maxPages) {
    state = await loadPage(state, slug);
    items.push(...state.items);
    pages++;
  }
  const episodes = parseEpisodes(items);
  if (!episodes.length) throw new Error(`AniZone has no episodes for ${slug}`);
  return episodes;
}

function chooseMode(episodes, expected, offset) {
  if (!expected || !offset) return "local";
  const local = episodes.filter((episode) => episode.number >= 1 && episode.number <= expected).length;
  const shifted = episodes.filter((episode) => episode.number > offset && episode.number <= offset + expected).length;
  return shifted > local ? "offset" : "local";
}

function ordinal(value) {
  const match = String(value || "").toLowerCase().match(/\b(?:part|special|chapter)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (!match) return 0;
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  return Number(match[1]) || words[match[1]] || 0;
}

function alignEpisodes(episodes, media, expected, series) {
  if (!expected || episodes.length <= expected) return episodes;
  const titles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const target = Math.max(0, ...titles.map(ordinal));
  if (target < 2) return episodes;
  let start = episodes.findIndex((episode) => ordinal(episode.title) === target);
  if (start < 0 && series?.partOrdinal === target && episodes.length === target) start = target - 1;
  if (start < 0 || episodes.length - start < expected) return episodes;
  return episodes.slice(start, start + expected).map((episode, index) => ({ ...episode, number: index + 1 }));
}

function buildEpisodeLists(anilistId, episodes, mode, offset, ctx, expected) {
  const sub = [];
  const dub = [];
  for (const source of episodes) {
    const number = mode === "offset" ? source.number - offset : source.number;
    if (number < 1 || expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? source.title ?? `Episode ${number}`,
      duration: meta.duration ?? source.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description ?? source.description,
      image: meta.image ?? source.image,
      airDate: meta.airDate ?? source.airDate,
      sourceNumber: source.sourceNumber,
    };
    if (source.hasSub) sub.push({ id: `watch/anizone/${anilistId}/sub/anizone-${number}`, ...base, audio: "sub" });
    if (source.hasDub) dub.push({ id: `watch/anizone/${anilistId}/dub/anizone-${number}`, ...base, audio: "dub" });
  }
  return { sub, dub };
}

async function seriesEpisodes(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const [series, offset] = await Promise.all([
    resolveSeries(anilistId, localCtx),
    getPrequelOffset(anilistId).catch(() => 0),
  ]);
  const expected = expectedCount(media, ctx.anizip);
  const limit = expected ? Math.max(expected, series.partOrdinal || 0) + offset : Infinity;
  const maxPages = Number.isFinite(ctx.maxPages) ? Math.max(1, ctx.maxPages) : Infinity;
  const rawEpisodes = await scrapeSeries(series.slug, limit, maxPages);
  const mode = chooseMode(rawEpisodes, expected, offset);
  return {
    media,
    ctx: localCtx,
    series,
    offset,
    expected,
    mode,
    episodes: alignEpisodes(rawEpisodes, media, expected, series),
  };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const data = await seriesEpisodes(anilistId, ctx);
  return {
    meta: {
      id: data.series.slug,
      title: data.series.title,
      source: "anizone",
      matchScore: Number(data.series.matchScore.toFixed(3)),
      numbering: data.mode,
      episodeOffset: data.mode === "offset" ? data.offset : 0,
    },
    episodes: buildEpisodeLists(anilistId, data.episodes, data.mode, data.offset, data.ctx, data.expected),
  };
}

async function scrapeWatch(slug, episode) {
  const { raw } = await fetchPage(`/anime/${slug}/${episode}`);
  const player = playerData(raw);
  if (!player?.src) {
    const error = new Error(`AniZone player payload not found for episode ${episode}`);
    error.rawBody = raw;
    throw error;
  }
  return {
    hls: normalizeUrl(player.src),
    subtitles: (Array.isArray(player.subtitles) ? player.subtitles : [])
      .filter((subtitle) => subtitle?.file)
      .map((subtitle) => ({
        url: normalizeUrl(subtitle.file),
        label: subtitle.title || "",
        srclang: subtitle.language || "",
        format: subtitle.format || "vtt",
        default: Boolean(subtitle.default),
      })),
    storyboard: normalizeUrl(player.storyboard) || null,
    chapters: normalizeUrl(player.chapter) || null,
  };
}

async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  const data = await seriesEpisodes(anilistId, ctx);
  const episode = data.episodes.find((item) => {
    const number = data.mode === "offset" ? item.number - data.offset : item.number;
    return number === Number(epNum);
  });
  if (!episode || (audio === "sub" && !episode.hasSub) || (audio === "dub" && !episode.hasDub)) {
    throw new Error(`AniZone ${audio} episode ${epNum} not found`);
  }
  const watch = await scrapeWatch(data.series.slug, episode.sourceNumber);
  return json({
    anilistId: Number(anilistId),
    episode: Number(epNum),
    providerEpisode: episode.sourceNumber,
    audio,
    streams: [{
      url: watch.hls,
      type: "hls",
      server: "AniZone",
      subtitles: watch.subtitles,
      storyboard: watch.storyboard,
      chapters: watch.chapters,
      priority: 1,
      isActive: true,
    }],
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
    try {
      const match = url.pathname.match(/^\/watch\/anizone\/(\d+)\/(sub|dub)\/anizone-(\d+)\/?$/);
      if (match) return await handleWatch(match[1], match[2], match[3]);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: error.message, "Raw-ERROR": error.rawBody ?? null, stack: error.stack }, 500);
    }
  },
};
