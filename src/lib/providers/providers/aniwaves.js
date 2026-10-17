import { getMedia } from "../core/anilist.js";
import { findVideoExtractor } from "../extractors/index.js";
import {
  buildTitles,
  buildTitleSearchQueries,
  decodeEntities,
  episodeMeta,
  expectedCount,
  json,
  titleIdentityScore,
} from "../core/new-provider-utils.js";
import { get, set, isFresh, SHOW_IDENTITY_TTL } from "../core/smartcache.js";

const BASE = "https://aniwaves.ru";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHtml(value = "") {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function attribute(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${escapeRegex(name)}=["']([^"']*)["']`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function formatName(value) {
  const name = String(value || "").toUpperCase();
  if (name.includes("SPECIAL")) return "special";
  if (name === "TV" || name === "TV_SHORT") return "tv";
  if (name === "MOVIE") return "movie";
  if (name === "OVA") return "ova";
  if (name === "ONA") return "ona";
  if (name === "SPECIAL") return "special";
  return "";
}

function searchQueries(titles) {
  return buildTitleSearchQueries(titles, 20);
}

async function fetchText(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      ...headers,
    },
  });
  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`AniWaves HTTP ${response.status}: ${url}`);
    error.rawBody = raw;
    throw error;
  }
  return raw;
}

async function fetchAjax(path, referer) {
  const raw = await fetchText(`${BASE}${path}`, {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": referer,
  });
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const error = new Error(`AniWaves returned invalid JSON: ${path}`);
    error.rawBody = raw;
    throw error;
  }
  if (Number(data?.status) !== 200) {
    const error = new Error(data?.message || `AniWaves request failed: ${path}`);
    error.rawBody = raw;
    throw error;
  }
  return data.result;
}

function parseSearchCards(html) {
  const found = new Map();
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const tag = match[1];
    if (!/\bclass=["'][^"']*\bname\b[^"']*\bd-title\b/i.test(tag)) continue;
    const href = attribute(tag, "href");
    const slug = href.match(/^\/watch\/([a-z0-9-]+)$/i)?.[1];
    if (!slug || found.has(slug)) continue;
    const siteId = Number(slug.match(/-(\d+)$/)?.[1]);
    if (!Number.isFinite(siteId)) continue;
    const title = stripHtml(match[2]);
    if (!title) continue;
    found.set(slug, {
      slug,
      siteId,
      title,
      japanese: attribute(tag, "data-jp"),
    });
  }
  return [...found.values()];
}

async function search(query) {
  const html = await fetchText(`${BASE}/filter?keyword=${encodeURIComponent(query)}`, {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": `${BASE}/`,
  });
  return parseSearchCards(html);
}

function detailField(html, label) {
  const match = html.match(new RegExp(`<div>\\s*${escapeRegex(label)}:\\s*<span[^>]*>([\\s\\S]*?)<\\/span>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function parseEpisodeCount(value) {
  const numbers = [...String(value).matchAll(/\d+/g)].map((match) => Number(match[0])).filter(Number.isFinite);
  return { available: numbers[0] ?? 0, total: numbers[1] ?? numbers[0] ?? 0 };
}

async function fetchDetail(candidate) {
  const html = await fetchText(`${BASE}/watch/${candidate.slug}`, {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": `${BASE}/`,
  });
  const premiered = detailField(html, "Premiered");
  const aired = detailField(html, "Date aired");
  const year = Number((aired.match(/\d{4}/)?.[0] ?? premiered.match(/\d{4}/)?.[0] ?? ""));
  return {
    ...candidate,
    title: candidate.title || stripHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? ""),
    type: formatName(detailField(html, "Type")),
    year: Number.isFinite(year) ? year : null,
    episodes: parseEpisodeCount(detailField(html, "Episodes")),
  };
}

function candidateTitleScore(titles, candidate) {
  const values = [candidate.title, candidate.japanese, candidate.slug.replace(/-/g, " ")].filter(Boolean);
  return titleIdentityScore(titles, values);
}

function coverageScore(candidate, expected, status) {
  if (!expected || expected < 1) return 0.5;
  if (candidate.episodes.available < 1) return 0;
  if (status !== "FINISHED") return 1;
  if (expected < 6) return 1;
  const needed = Math.ceil(expected * 0.8);
  return Math.min(1, candidate.episodes.available / needed);
}

function validateCandidate(candidate, media, titles, expected) {
  const titleScore = candidateTitleScore(titles, candidate);
  const expectedType = formatName(media?.format);
  const expectedYear = Number(media?.startDate?.year ?? media?.seasonYear ?? 0) || null;
  const primaryTitles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const partOrdinal = Math.max(0, ...primaryTitles.map(ordinal));
  const partMapping = expected === 1
    && expectedType === "special"
    && candidate.type === "special"
    && expectedYear
    && candidate.year === expectedYear
    && partOrdinal >= 2
    && candidate.episodes.available === partOrdinal
    && titleScore >= 0.65;
  if (titleScore < 0.68 && !partMapping) return null;
  if (expectedType && candidate.type && expectedType !== candidate.type) return null;
  if (expectedYear && candidate.year && expectedYear !== candidate.year) return null;
  const coverage = coverageScore(candidate, expected, media?.status);
  if (expected >= 6 && coverage < 0.8) return null;
  const score = titleScore * 0.72 + (expectedType && candidate.type === expectedType ? 0.14 : 0.07) + (expectedYear && candidate.year === expectedYear ? 0.1 : 0.04) + coverage * 0.04;
  return { ...candidate, titleScore, coverage, score, partOrdinal: partMapping ? partOrdinal : 0 };
}

async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:match2:aniwaves:${anilistId}`;
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
  const shortlist = [...discovered.values()]
    .map((candidate) => ({ candidate, score: candidateTitleScore(titles, candidate) }))
    .filter((item) => item.score >= 0.5)
    .sort((left, right) => right.score - left.score)
    .slice(0, 12)
    .map((item) => item.candidate);
  const details = await Promise.all(shortlist.map((candidate) => fetchDetail(candidate).catch(() => null)));
  const valid = details
    .filter(Boolean)
    .map((candidate) => validateCandidate(candidate, media, titles, expected))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
  const selected = valid[0];
  const runnerUp = valid[1];
  if (!selected || (selected.score < 0.82 && !selected.partOrdinal) || (runnerUp && selected.score - runnerUp.score < 0.08)) {
    throw new Error(`AniWaves match not confident for AniList ${anilistId}`);
  }
  const data = {
    siteId: selected.siteId,
    slug: selected.slug,
    title: selected.title,
    score: selected.score,
    matchScore: selected.titleScore,
    episodeCount: selected.episodes.available,
    type: selected.type,
    year: selected.year,
    partOrdinal: selected.partOrdinal,
  };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}

function parseEpisodes(html) {
  const episodes = [];
  const seen = new Set();
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1];
    const number = Number(attribute(attrs, "data-num"));
    const sourceNumber = attribute(attrs, "data-slug") || String(number);
    if (!Number.isFinite(number) || number < 1 || seen.has(number)) continue;
    const ids = attribute(attrs, "data-ids");
    if (!ids) continue;
    seen.add(number);
    episodes.push({
      number,
      sourceNumber,
      ids,
      title: stripHtml(match[2]).replace(/^\d+\s*/, "") || `Episode ${number}`,
      airDate: attribute(attrs, "data-aired") || null,
      duration: Number(attribute(attrs, "data-duration")) || null,
      filler: attribute(attrs, "data-filler") === "1",
      recap: attribute(attrs, "data-recap") === "1",
      hasSub: attribute(attrs, "data-sub") === "1",
      hasDub: attribute(attrs, "data-dub") === "1",
    });
  }
  return episodes.sort((left, right) => left.number - right.number);
}

async function fetchEpisodes(series) {
  const result = await fetchAjax(`/ajax/episode/list/${series.siteId}?vrf=`, `${BASE}/watch/${series.slug}`);
  const episodes = parseEpisodes(String(result || ""));
  if (!episodes.length) throw new Error(`AniWaves has no episodes for ${series.slug}`);
  return episodes;
}

function ordinal(value) {
  const match = String(value || "").toLowerCase().match(/\b(?:part|special|chapter)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (!match) return 0;
  const word = match[1];
  const numbers = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  return Number(word) || numbers[word] || 0;
}

function alignEpisodes(sourceEpisodes, media, expected, series) {
  if (!expected || sourceEpisodes.length <= expected) return sourceEpisodes;
  const targetTitles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const targetOrdinal = Math.max(0, ...targetTitles.map(ordinal));
  if (targetOrdinal < 2) return sourceEpisodes;
  let start = sourceEpisodes.findIndex((episode) => ordinal(episode.title) === targetOrdinal);
  if (start < 0 && series?.partOrdinal === targetOrdinal && sourceEpisodes.length === targetOrdinal) start = targetOrdinal - 1;
  if (start < 0 || sourceEpisodes.length - start < expected) return sourceEpisodes;
  return sourceEpisodes.slice(start, start + expected).map((episode, index) => ({ ...episode, number: index + 1 }));
}

function buildEpisodeLists(anilistId, sourceEpisodes, ctx, expected) {
  const sub = [];
  const dub = [];
  for (const source of sourceEpisodes) {
    if (expected && source.number > expected) continue;
    const meta = episodeMeta(source.number, ctx);
    const base = {
      number: source.number,
      title: meta.title ?? source.title,
      duration: meta.duration ?? source.duration ?? null,
      filler: meta.filler ?? source.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate ?? source.airDate,
      recap: source.recap,
      sourceNumber: source.sourceNumber,
    };
    if (source.hasSub) sub.push({ ...base, id: `watch/aniwaves/${anilistId}/sub/aniwaves-${source.number}`, audio: "sub" });
    if (source.hasDub) dub.push({ ...base, id: `watch/aniwaves/${anilistId}/dub/aniwaves-${source.number}`, audio: "dub" });
  }
  return { sub, dub };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const [series, expected] = await Promise.all([
    resolveSeries(anilistId, localCtx),
    Promise.resolve(expectedCount(media, ctx.anizip)),
  ]);
  const episodes = alignEpisodes(await fetchEpisodes(series), media, expected, series);
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "aniwaves",
      matchScore: Number(series.matchScore.toFixed(3)),
      numbering: "standard",
      episodeOffset: 0,
    },
    episodes: buildEpisodeLists(anilistId, episodes, localCtx, expected),
  };
}

function parseServerGroups(html) {
  const groups = [];
  const markers = [...html.matchAll(/<div\b([^>]*)>/gi)]
    .map((match) => ({ index: match.index, attrs: match[1], type: attribute(match[1], "data-type") }))
    .filter((item) => item.type === "sub" || item.type === "dub");
  for (let index = 0; index < markers.length; index++) {
    const current = markers[index];
    const end = markers[index + 1]?.index ?? html.length;
    const segment = html.slice(current.index, end);
    for (const match of segment.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)) {
      const attrs = match[1];
      const linkId = attribute(attrs, "data-link-id");
      if (!linkId) continue;
      groups.push({
        audio: current.type,
        linkId,
        serverId: attribute(attrs, "data-sv-id") || null,
        server: stripHtml(match[2]) || "AniWaves",
      });
    }
  }
  return groups;
}

async function fetchServers(series, episode) {
  const result = await fetchAjax(
    `/ajax/server/list?servers=${encodeURIComponent(series.siteId)}&eps=${encodeURIComponent(episode.sourceNumber)}`,
    `${BASE}/watch/${series.slug}/ep-${episode.sourceNumber}`,
  );
  return parseServerGroups(String(result || ""));
}

async function fetchSource(linkId, referer) {
  const result = await fetchAjax(`/ajax/sources?id=${encodeURIComponent(linkId)}&asi=0&autoPlay=0`, referer);
  if (!result?.url) throw new Error("AniWaves source response has no embed url");
  return result;
}

async function resolveSource(source, referer) {
  const extractor = findVideoExtractor(source.url);
  if (!extractor) return [];
  try {
    const streams = await extractor.extract(source.url, { userAgent: UA, referer });
    return streams.map((stream) => typeof stream === "string" ? { url: stream, type: "hls" } : stream);
  } catch {
    return [];
  }
}

function skipRange(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const start = Number(value[0]);
  const end = Number(value[1]);
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? { start, end } : null;
}

async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const series = await resolveSeries(anilistId, { ...ctx, media });
  const expected = expectedCount(media, ctx.anizip);
  const episodes = alignEpisodes(await fetchEpisodes(series), media, expected, series);
  const episode = episodes.find((item) => item.number === Number(epNum));
  if (!episode || (audio === "sub" && !episode.hasSub) || (audio === "dub" && !episode.hasDub)) {
    throw new Error(`AniWaves ${audio} episode ${epNum} not found`);
  }
  const servers = (await fetchServers(series, episode)).filter((server) => server.audio === audio);
  if (!servers.length) throw new Error(`AniWaves has no ${audio} servers for episode ${epNum}`);
  const referer = `${BASE}/watch/${series.slug}/ep-${episode.sourceNumber}`;
  const settled = await Promise.all(servers.map(async (server) => {
    try {
      return { server, source: await fetchSource(server.linkId, referer) };
    } catch (error) {
      return { server, error };
    }
  }));
  const resolved = await Promise.all(settled.map(async (item) => ({
    ...item,
    direct: item.source?.url ? await resolveSource(item.source, referer) : [],
  })));
  const streams = [];
  let intro = null;
  let outro = null;
  for (const item of resolved) {
    if (!item.source?.url) continue;
    const sourceReferer = (() => {
      try { return `${new URL(item.source.url).origin}/`; } catch { return referer; }
    })();
    const skip = item.source.skip_data ?? {};
    intro ??= skipRange(skip.intro);
    outro ??= skipRange(skip.outro);
    for (const stream of item.direct) {
      streams.push({
        url: stream.url,
        type: stream.type,
        server: item.server.server,
        referer: sourceReferer,
        quality: stream.quality,
        priority: streams.length ? 4 : 5,
        isActive: streams.length === 0,
      });
    }
    streams.push({
      url: item.source.url,
      type: "embed",
      server: item.server.server,
      referer: sourceReferer,
      priority: streams.length ? 4 : 5,
      isActive: streams.length === 0,
    });
  }
  if (!streams.length) {
    const failure = settled.find((item) => item.error)?.error;
    throw failure ?? new Error(`AniWaves sources unavailable for episode ${epNum}`);
  }
  return json({
    anilistId: Number(anilistId),
    episode: Number(epNum),
    providerEpisode: episode.sourceNumber,
    audio,
    intro,
    outro,
    streams,
  });
}

export default {
  async fetch(request) {
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
    const url = new URL(request.url);
    try {
      const match = url.pathname.match(/^\/watch\/aniwaves\/(\d+)\/(sub|dub)\/aniwaves-(\d+)\/?$/);
      if (match) return await handleWatch(match[1], match[2], match[3]);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: error.message, "Raw-ERROR": error.rawBody ?? null, stack: error.stack }, 500);
    }
  },
};
