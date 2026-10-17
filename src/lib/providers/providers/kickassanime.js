import {
  buildTitleSearchQueries,
  buildTitles,
  episodeMeta,
  expectedCount,
  json,
  titleIdentityScore,
} from "../core/new-provider-utils.js";
import { getMedia } from "../core/anilist.js";
import {
  get as cacheGet,
  set as cacheSet,
  isFresh,
  SHOW_IDENTITY_TTL,
} from "../core/smartcache.js";

const BASE     = "https://kaa.lt";
const HLS_BASE = "https://hls.krussdomi.com/manifest";
const UA       = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const H        = { "User-Agent": UA, Accept: "application/json" };

async function kaaSearch(query) {
  const res = await fetch(`${BASE}/api/fsearch`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ page: 1, query }),
  });
  if (!res.ok) throw new Error(`kaa fsearch HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.result) ? data.result : [];
}

async function kaaShowInfo(showSlug) {
  const res = await fetch(`${BASE}/api/show/${showSlug}`, { headers: H });
  if (!res.ok) throw new Error(`kaa show HTTP ${res.status}: ${showSlug}`);
  return res.json();
}

async function kaaEpisodePage(showSlug, ep) {
  const res = await fetch(
    `${BASE}/api/show/${showSlug}/episodes?ep=${ep}&lang=ja-JP`,
    { headers: H }
  );
  if (!res.ok) throw new Error(`kaa episodes HTTP ${res.status}`);
  return res.json();
}

async function kaaAllEpisodes(showSlug) {
  const first = await kaaEpisodePage(showSlug, 1);
  const pages  = Array.isArray(first.pages)  ? first.pages  : [];
  const all    = Array.isArray(first.result) ? [...first.result] : [];

  if (pages.length > 1) {
    const rest = await Promise.all(
      pages.slice(1).map(async (pg) => {
        const startEp = pg.eps?.[0];
        if (!startEp) return [];
        const d = await kaaEpisodePage(showSlug, startEp);
        return Array.isArray(d.result) ? d.result : [];
      })
    );
    for (const batch of rest) all.push(...batch);
  }

  return all;
}

async function kaaEpisodeServers(showSlug, fullEpSlug) {
  const res = await fetch(
    `${BASE}/api/show/${showSlug}/episode/${fullEpSlug}`,
    { headers: H }
  );
  if (!res.ok) throw new Error(`kaa episode servers HTTP ${res.status}`);
  return res.json();
}

function buildKaaQueries(titles) {
  const queries = new Set();
  for (const title of titles.slice(0, 4)) {
    if (/[\u3000-\u9fff\u4e00-\u9faf]/.test(title)) continue;
    const clean = title.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!clean || clean.length < 3) continue;
    const words = clean.split(" ").filter(Boolean);
    if (words.length <= 3) {
      queries.add(clean);
    } else {
      queries.add(words.slice(0, 2).join(" "));
      queries.add(words.slice(0, 3).join(" "));
    }
  }
  return [...queries];
}

function scoreCandidate(candidate, titles, seasonYear, anilistFormat) {
  const titleEn = candidate.title_en || "";
  const titleJp = candidate.title   || "";
  const kaaYear = Number(candidate.year);
  const kaaType = (candidate.type || "").toLowerCase();

  const base = titleIdentityScore(titles, [titleEn, titleJp, candidate.slug]);

  let yearMult = 1.0;
  if (seasonYear && kaaYear) {
    const diff = Math.abs(Number(seasonYear) - kaaYear);
    if (diff === 0)      yearMult = 1.2;
    else if (diff === 1) yearMult = 0.8;
    else                 yearMult = 0.5;
  }

  let typeMult = 1.0;
  const af = (anilistFormat || "").toUpperCase();
  if      (af === "MOVIE" && kaaType !== "movie")                        typeMult = 0.25;
  else if (af !== "MOVIE" && kaaType === "movie")                        typeMult = 0.25;
  else if ((af === "OVA" || af === "ONA" || af === "SPECIAL") && kaaType === "tv") typeMult = 0.5;
  else if (af === "TV"   && (kaaType === "ova" || kaaType === "special")) typeMult = 0.5;

  return Math.min(1, base * yearMult) * typeMult;
}

async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:match2:kaa:${anilistId}`;
  const cached   = cacheGet(cacheKey);
  if (isFresh(cached)) return cached.data;

  const media      = ctx.media ?? await getMedia(anilistId);
  const titles     = buildTitles(media, ctx.anizip);
  const queries    = [...new Set([...buildKaaQueries(titles), ...buildTitleSearchQueries(titles, 12)])].slice(0, 20);
  const seasonYear = media?.seasonYear;
  const format     = media?.format;

  if (!queries.length) throw new Error(`KAA: no usable search queries for AniList ${anilistId}`);

  const allCandidates = new Map();
  await Promise.all(
    queries.map(async (q) => {
      try {
        const results = await kaaSearch(q);
        for (const r of results) {
          if (!allCandidates.has(r.slug)) allCandidates.set(r.slug, r);
        }
      } catch {}
    })
  );

  if (!allCandidates.size) throw new Error(`KAA: no search results for AniList ${anilistId}`);

  const scored = [];
  for (const [, candidate] of allCandidates) {
    const score = scoreCandidate(candidate, titles, seasonYear, format);
    if (score >= 0.5) {
      scored.push({
        slug:    candidate.slug,
        title:   candidate.title_en || candidate.title,
        locales: Array.isArray(candidate.locales) ? candidate.locales : [],
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (!scored.length) {
    throw new Error(`KAA: no confident match for AniList ${anilistId}`);
  }

  const best = scored[0];
  if (best.score < 0.6) {
    throw new Error(
      `KAA: low confidence match for AniList ${anilistId} — best "${best.slug}" score ${best.score.toFixed(3)}`
    );
  }

  const data = {
    slug:    best.slug,
    title:   best.title,
    locales: best.locales,
    score:   best.score,
  };
  cacheSet(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}

async function buildEpMap(showSlug, showInfo) {
  if (showInfo?.type === "movie") {
    const m = (showInfo.watch_uri || "").match(/\/(ep-(\d+)-([a-f0-9]+))$/i);
    if (m) return [{ number: 1, fullSlug: m[1] }];
    return [];
  }
  const episodes = await kaaAllEpisodes(showSlug);
  return episodes.map((e) => ({
    number:   e.episode_number,
    fullSlug: `ep-${e.episode_number}-${e.slug}`,
    title:    e.title,
    duration: e.duration_ms ? Math.round(e.duration_ms / 1000) : null,
  }));
}

function titleOrdinal(value) {
  const match = String(value || "").toLowerCase().match(/\b(?:part|special|chapter)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (!match) return 0;
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  return Number(match[1]) || words[match[1]] || 0;
}

function alignEpisodes(episodes, media, expected) {
  if (!expected || episodes.length <= expected) return episodes;
  const titles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean);
  const targetOrdinal = Math.max(0, ...titles.map(titleOrdinal));
  if (targetOrdinal < 2) return episodes;
  const start = episodes.findIndex((episode) => titleOrdinal(episode.title) === targetOrdinal);
  if (start < 0 || episodes.length - start < expected) return episodes;
  return episodes.slice(start, start + expected).map((episode, index) => ({
    ...episode,
    sourceNumber: episode.number,
    number: index + 1,
  }));
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media    = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series   = await resolveSeries(anilistId, localCtx);
  const showInfo = await kaaShowInfo(series.slug);

  const locales  = Array.isArray(showInfo.locales) ? showInfo.locales : series.locales;
  const hasDub   = locales.includes("en-US");

  const expected = expectedCount(media, ctx.anizip);
  const epMap    = alignEpisodes(await buildEpMap(series.slug, showInfo), media, expected);
  if (!epMap.length) throw new Error(`KAA: no episodes found for AniList ${anilistId} (slug: ${series.slug})`);

  const sub      = [];
  const dub      = [];

  for (const ep of epMap) {
    const num = ep.number;
    if (!Number.isFinite(num) || num < 1)   continue;
    if (expected && num > expected)          continue;
    const meta = episodeMeta(num, localCtx);
    const base = {
      number:      num,
      title:       meta.title       ?? ep.title ?? `Episode ${num}`,
      duration:    meta.duration    ?? ep.duration,
      filler:      meta.filler,
      uncensored:  false,
      description: meta.description,
      image:       meta.image,
      airDate:     meta.airDate,
      sourceNumber: ep.sourceNumber ?? ep.number,
    };
    sub.push({ id: `watch/kaa/${anilistId}/sub/kaa-${num}`, ...base, audio: "sub" });
    if (hasDub) {
      dub.push({ id: `watch/kaa/${anilistId}/dub/kaa-${num}`, ...base, audio: "dub" });
    }
  }

  return {
    meta: {
      id:         series.slug,
      title:      series.title,
      source:     "kaa",
      matchScore: Number(series.score.toFixed(3)),
    },
    episodes: { sub, dub },
  };
}

async function handleWatch(anilistId, audio, epNum) {
  const media    = await getMedia(anilistId);
  const series   = await resolveSeries(anilistId, { media });
  const showInfo = await kaaShowInfo(series.slug);

  const locales = Array.isArray(showInfo.locales) ? showInfo.locales : series.locales;
  if (audio === "dub" && !locales.includes("en-US")) {
    return json({ error: `KAA: no English dub for AniList ${anilistId}` }, 404);
  }

  const epMap = alignEpisodes(
    await buildEpMap(series.slug, showInfo),
    media,
    expectedCount(media),
  );
  const ep    = epMap.find((e) => e.number === Number(epNum));
  if (!ep) {
    return json({ error: `KAA: episode ${epNum} not found for AniList ${anilistId}` }, 404);
  }

  const episodeData = await kaaEpisodeServers(series.slug, ep.fullSlug);
  const servers     = Array.isArray(episodeData.servers) ? episodeData.servers : [];
  if (!servers.length) {
    return json({ error: `KAA: no streams for episode ${epNum} (AniList ${anilistId})` }, 404);
  }

  const streams = [];
  for (const s of servers) {
    if (!s.src) continue;
    const m = s.src.match(/[?&]id=([^&]+)/);
    if (!m) continue;
    streams.push({
      url:      `${HLS_BASE}/${m[1]}/master.m3u8`,
      type:     "hls",
      server:   s.name || "KAA",
      headers:  { Referer: "https://krussdomi.com/" },
      priority: 1,
      isActive: true,
    });
  }

  if (!streams.length) {
    return json({ error: `KAA: could not resolve stream for episode ${epNum}` }, 404);
  }

  return json({
    anilistId: Number(anilistId),
    episode:   Number(epNum),
    audio,
    streams,
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/watch\/kaa\/(\d+)\/(sub|dub)\/kaa-(\d+)\/?$/);
      if (m) return await handleWatch(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  },
};
