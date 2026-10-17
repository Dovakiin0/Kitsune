import { getMedia } from "../core/anilist.js";
import {
  buildTitles,
  buildTitleSearchQueries,
  episodeMeta,
  expectedCount,
  json,
  titleIdentityScore,
} from "../core/new-provider-utils.js";
import { get, set, isFresh, SHOW_IDENTITY_TTL } from "../core/smartcache.js";

const SITE = "https://www.animeonsen.xyz";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

let session = null;
let sessionInFlight = null;

function attribute(tag, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return String(tag).match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, "i"))?.[1] ?? "";
}

function metaContent(html, name) {
  for (const match of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], "name").toLowerCase() === name.toLowerCase()) return attribute(match[0], "content");
  }
  return "";
}

function sessionCookie(headers) {
  const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [headers.get("set-cookie")].filter(Boolean);
  for (const value of values) {
    const cookie = String(value).match(/(?:^|;\s*)ao\.session=([^;]+)/)?.[1];
    if (cookie) return cookie;
  }
  return "";
}

function decodeToken(cookie) {
  const decoded = Buffer.from(decodeURIComponent(cookie), "base64").toString("utf8");
  const token = [...decoded].map((char) => String.fromCharCode(char.charCodeAt(0) + 1)).join("");
  if (!token || !/^[\x20-\x7e]+$/.test(token)) throw new Error("AnimeOnsen returned an invalid session token");
  return token;
}

async function createSession() {
  const response = await fetch(`${SITE}/`, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`AnimeOnsen homepage HTTP ${response.status}`);
  const cookie = sessionCookie(response.headers);
  const apiOrigin = metaContent(html, "ao-api-origin");
  const searchOrigin = metaContent(html, "ao-search-origin");
  const searchToken = metaContent(html, "ao-search-token");
  if (!cookie || !apiOrigin || !searchOrigin || !searchToken) throw new Error("AnimeOnsen session bootstrap data missing");
  return {
    token: decodeToken(cookie),
    apiOrigin: new URL(apiOrigin).origin,
    searchOrigin: new URL(searchOrigin).origin,
    searchToken,
  };
}

async function getSession(force = false) {
  if (force) session = null;
  if (session) return session;
  if (!sessionInFlight) {
    sessionInFlight = createSession()
      .then((value) => {
        session = value;
        return value;
      })
      .finally(() => {
        sessionInFlight = null;
      });
  }
  return sessionInFlight;
}

async function responseJson(response, label) {
  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`AnimeOnsen ${label} HTTP ${response.status}`);
    error.status = response.status;
    error.rawBody = raw;
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error(`AnimeOnsen ${label} returned invalid JSON`);
    error.rawBody = raw;
    throw error;
  }
}

async function apiJson(path, retry = true) {
  const current = await getSession();
  const response = await fetch(`${current.apiOrigin}${path}`, {
    headers: {
      Authorization: `Bearer ${current.token}`,
      Accept: "application/json, text/plain, */*",
      Origin: SITE,
      Referer: `${SITE}/`,
      "User-Agent": UA,
    },
  });
  if ((response.status === 401 || response.status === 403) && retry) {
    await getSession(true);
    return apiJson(path, false);
  }
  return responseJson(response, path);
}

async function search(query, retry = true) {
  const current = await getSession();
  const response = await fetch(`${current.searchOrigin}/multi-search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${current.searchToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: SITE,
      Referer: `${SITE}/`,
      "User-Agent": UA,
    },
    body: JSON.stringify({
      queries: [{ indexUid: "content", q: query, limit: 20 }],
    }),
  });
  if ((response.status === 401 || response.status === 403) && retry) {
    await getSession(true);
    return search(query, false);
  }
  const data = await responseJson(response, `search: ${query}`);
  return Array.isArray(data?.results?.[0]?.hits) ? data.results[0].hits : [];
}

function searchQueries(titles) {
  return buildTitleSearchQueries(titles, 20);
}

function titleScore(titles, candidate) {
  const values = [candidate.content_title_en, candidate.content_title, candidate.content_title_jp].filter(Boolean);
  return titleIdentityScore(titles, values);
}

async function inspectCandidate(candidate) {
  const contentId = String(candidate?.content_id || "");
  if (!contentId) return null;
  try {
    const video = await apiJson(`/v4/content/${encodeURIComponent(contentId)}/video/1`);
    const metadata = video?.metadata;
    if (!metadata) return null;
    const episodeValues = Array.isArray(metadata.episode) ? metadata.episode : [metadata.episode];
    let episodeMap = null;
    for (const value of episodeValues) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      if (Object.entries(value).some(([number, episode]) => /^\d+$/.test(number) && episode && typeof episode === "object" && (episode.contentTitle_episode_en || episode.contentTitle_episode_jp))) {
        episodeMap = value;
      }
    }
    return {
      contentId,
      title: candidate.content_title_en || candidate.content_title || "",
      candidate,
      malId: Number(metadata.mal_id) || null,
      episodeCount: Number(metadata.total_episodes) || 0,
      isMovie: Boolean(metadata.is_movie),
      episodeTitles: Object.entries(episodeMap || {}).map(([number, episode]) => ({
        number: Number(number),
        title: episode.contentTitle_episode_en || episode.contentTitle_episode_jp || "",
      })).filter((episode) => Number.isInteger(episode.number) && episode.number >= 1),
    };
  } catch {
    return null;
  }
}

function titleOrdinal(value) {
  const match = String(value || "").toLowerCase().match(/\b(?:part|special|chapter)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (!match) return 0;
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  return Number(match[1]) || words[match[1]] || 0;
}

function coverageScore(episodeCount, expected, status) {
  if (!expected || expected < 2) return 1;
  if (!episodeCount) return 0.5;
  if (status !== "FINISHED") return 1;
  if (episodeCount === expected) return 1;
  if (episodeCount > expected && episodeCount <= expected + 2) return 0.95;
  return Math.min(1, episodeCount / expected);
}

function validateCandidate(candidate, media, titles, expected) {
  const title = titleScore(titles, candidate.candidate);
  const expectedMovie = media?.format === "MOVIE";
  if (candidate.isMovie !== expectedMovie) return null;
  const primaryTitles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const partOrdinal = Math.max(0, ...primaryTitles.map(titleOrdinal));
  const partMapping = expected === 1
    && media?.format === "SPECIAL"
    && partOrdinal >= 2
    && candidate.episodeCount === partOrdinal
    && candidate.episodeTitles.some((episode) => episode.number === partOrdinal)
    && title >= 0.65;
  const coverage = coverageScore(candidate.episodeCount, expected, media?.status);
  if (expected >= 6) {
    const minimum = media?.status === "FINISHED" ? Math.ceil(expected * 0.8) : 1;
    if (candidate.episodeCount < minimum) return null;
  }
  if (title < 0.7 && !partMapping) return null;
  return {
    ...candidate,
    titleScore: title,
    coverage,
    score: title * 0.7 + coverage * 0.2 + 0.1,
    partOrdinal: partMapping ? partOrdinal : 0,
  };
}

async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:match2:animeonsen:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const primaryTitles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const titles = [...new Set([...primaryTitles, ...buildTitles(media, ctx.anizip)])];
  if (!titles.length) throw new Error(`AnimeOnsen has no AniList titles for ${anilistId}`);
  const expected = expectedCount(media, ctx.anizip);
  const discovered = new Map();
  await Promise.all(searchQueries(titles).map(async (query) => {
    try {
      for (const candidate of await search(query)) {
        if (candidate?.content_id && !discovered.has(candidate.content_id)) discovered.set(candidate.content_id, candidate);
      }
    } catch {}
  }));
  const shortlist = [...discovered.values()]
    .map((candidate) => ({ candidate, score: titleScore(titles, candidate) }))
    .filter((item) => item.score >= 0.42)
    .sort((left, right) => right.score - left.score)
    .slice(0, 14)
    .map((item) => item.candidate);
  const inspected = (await Promise.all(shortlist.map(inspectCandidate))).filter(Boolean);
  const expectedMalId = Number(media?.idMal) || null;
  const exact = expectedMalId
    ? inspected.filter((candidate) => candidate.malId === expectedMalId)
    : [];
  const validated = (exact.length ? exact : inspected.filter((candidate) => !expectedMalId || !candidate.malId))
    .map((candidate) => validateCandidate(candidate, media, titles, expected))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
  const selected = validated[0];
  const runnerUp = validated[1];
  if (!selected || (!exact.length && ((selected.score < 0.82 && !selected.partOrdinal) || (runnerUp && selected.score - runnerUp.score < 0.08)))) {
    throw new Error(`AnimeOnsen match not confident for AniList ${anilistId}`);
  }
  const data = {
    contentId: selected.contentId,
    title: selected.title,
    malId: selected.malId,
    episodeCount: selected.episodeCount,
    isMovie: selected.isMovie,
    matchScore: selected.titleScore,
    score: selected.score,
    partOrdinal: selected.partOrdinal,
  };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}

async function fetchEpisodes(series) {
  const data = await apiJson(`/v4/content/${encodeURIComponent(series.contentId)}/episodes`);
  const episodes = Object.entries(data ?? {})
    .map(([sourceNumber, detail]) => ({
      number: Number(sourceNumber),
      sourceNumber,
      title: detail?.contentTitle_episode_en || detail?.contentTitle_episode_jp || null,
    }))
    .filter((episode) => Number.isInteger(episode.number) && episode.number >= 1)
    .sort((left, right) => left.number - right.number);
  if (episodes.length) return episodes;
  if (series.isMovie) return [{ number: 1, sourceNumber: "1", title: null }];
  throw new Error(`AnimeOnsen has no episodes for ${series.contentId}`);
}

function alignEpisodes(episodes, media, expected, series) {
  if (!expected || episodes.length <= expected) return episodes;
  const titles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const targetOrdinal = Math.max(0, ...titles.map(titleOrdinal));
  if (targetOrdinal < 2) return episodes;
  let start = episodes.findIndex((episode) => titleOrdinal(episode.title) === targetOrdinal);
  if (start < 0 && series?.partOrdinal === targetOrdinal && episodes.length === targetOrdinal) start = targetOrdinal - 1;
  if (start < 0 || episodes.length - start < expected) return episodes;
  return episodes.slice(start, start + expected).map((episode, index) => ({ ...episode, number: index + 1 }));
}

function episodeList(anilistId, episodes, ctx, expected) {
  return episodes
    .filter((episode) => !expected || episode.number <= expected)
    .map((episode) => {
      const meta = episodeMeta(episode.number, ctx);
      return {
        id: `watch/animeonsen/${anilistId}/sub/animeonsen-${episode.number}`,
        number: episode.number,
        sourceNumber: episode.sourceNumber,
        title: meta.title ?? episode.title ?? `Episode ${episode.number}`,
        duration: meta.duration,
        audio: "sub",
        filler: meta.filler,
        uncensored: false,
        description: meta.description,
        image: meta.image,
        airDate: meta.airDate,
      };
    });
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const [series, expected] = await Promise.all([
    resolveSeries(anilistId, localCtx),
    Promise.resolve(expectedCount(media, ctx.anizip)),
  ]);
  return {
    meta: {
      id: series.contentId,
      title: series.title,
      source: "animeonsen",
      matchScore: Number(series.matchScore.toFixed(3)),
      numbering: "standard",
      episodeOffset: 0,
    },
    episodes: {
      sub: episodeList(anilistId, alignEpisodes(await fetchEpisodes(series), media, expected, series), localCtx, expected),
      dub: [],
    },
  };
}

function skipRange(start, end) {
  const from = Number(start);
  const to = Number(end);
  return Number.isFinite(from) && Number.isFinite(to) && to > from ? { start: from, end: to } : null;
}

function videoSubtitles(video, headers) {
  const labels = video?.metadata?.subtitles ?? {};
  return Object.entries(video?.uri?.subtitles ?? {}).map(([language, url]) => ({
    url,
    label: labels[language] || language,
    srclang: language,
    default: language === "en-US",
    headers,
  }));
}

async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  if (audio !== "sub") throw new Error("AnimeOnsen only provides subtitled streams");
  const media = ctx.media ?? await getMedia(anilistId);
  const series = await resolveSeries(anilistId, { ...ctx, media });
  const expected = expectedCount(media, ctx.anizip);
  const episodes = alignEpisodes(await fetchEpisodes(series), media, expected, series);
  const episode = episodes.find((item) => item.number === Number(epNum) && (!expected || item.number <= expected));
  if (!episode) throw new Error(`AnimeOnsen episode ${epNum} not found`);
  const video = await apiJson(`/v4/content/${encodeURIComponent(series.contentId)}/video/${encodeURIComponent(episode.sourceNumber)}`);
  const stream = video?.uri?.stream;
  if (!stream) throw new Error(`AnimeOnsen has no stream for episode ${epNum}`);
  const current = await getSession();
  const headers = { Authorization: `Bearer ${current.token}` };
  const skip = Array.isArray(video?.metadata?.episode)
    ? video.metadata.episode.find((item) => item && typeof item === "object" && ("skipIntro_s" in item || "skipIntro_e" in item))
    : null;
  return json({
    anilistId: Number(anilistId),
    episode: Number(epNum),
    providerEpisode: episode.sourceNumber,
    audio,
    intro: skipRange(skip?.skipIntro_s, skip?.skipIntro_e),
    outro: null,
    streams: [{
      url: stream,
      type: "dash",
      server: "AnimeOnsen",
      referer: `${SITE}/`,
      headers,
      subtitles: videoSubtitles(video, headers),
      priority: 5,
      isActive: true,
    }],
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
    const match = url.pathname.match(/^\/watch\/animeonsen\/(\d+)\/(sub|dub)\/animeonsen-(\d+)\/?$/);
    if (!match) return json({ error: "Not found" }, 404);
    try {
      return await handleWatch(match[1], match[2], match[3]);
    } catch (error) {
      return json({ error: error.message, "Raw-ERROR": error.rawBody ?? null, stack: error.stack }, 500);
    }
  },
};
