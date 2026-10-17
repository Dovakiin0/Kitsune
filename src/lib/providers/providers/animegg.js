import { getMedia } from "../core/anilist.js";
import {
  attr,
  buildTitles,
  decodeEntities,
  episodeMeta,
  expectedCount,
  fetchHtml,
  findTopSlugs,
  getPrequelOffset,
  json,
  selectSeries,
  stripTags,
} from "../core/new-provider-utils.js";
import { get, set, isFresh, SHOW_IDENTITY_TTL } from "../core/smartcache.js";

const BASE = "https://www.animegg.org";

async function search(query) {
  const html = await fetchHtml(`${BASE}/search/?q=${encodeURIComponent(query)}`);
  const results = [];
  for (const m of html.matchAll(/<a\b[^>]*class=["'][^"']*\bmse\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)) {
    const tag = m[0].match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = attr(tag, "href");
    const slug = href.match(/^\/series\/([^/?#]+)/)?.[1];
    if (!slug) continue;
    const strong = m[0].match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1];
    results.push({ slug, text: strong ? stripTags(strong) : slug.replace(/-/g, " ") });
  }
  return results;
}

async function scrapeSeries(slug) {
  const html = await fetchHtml(`${BASE}/series/${slug}`);
  const episodes = [];
  for (const m of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const block = m[1];
    if (!/\banm_det_pop\b/.test(block)) continue;
    const link = block.match(/<a\b[^>]*class=["'][^"']*anm_det_pop[^"']*["'][^>]*>/i)?.[0] ?? "";
    const href = attr(link, "href").replace(/#.*$/, "").replace(/^\//, "");
    const strong = stripTags(block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? "");
    const rangeMatch = strong.match(/(\d+)-(\d+)\s*$/);
    const numMatch = rangeMatch || strong.match(/(\d+)\s*$/);
    if (!numMatch || !href) continue;
    const number = parseInt(numMatch[1]);
    const title = stripTags(block.match(/<i\b[^>]*class=["'][^"']*anititle[^"']*["'][^>]*>([\s\S]*?)<\/i>/i)?.[1] ?? "") || strong;
    const audio = [];
    if (/\bbtn-subbed\b/.test(block)) audio.push("sub");
    if (/\bbtn-dubbed\b/.test(block)) audio.push("dub");
    episodes.push({ number, title, epSlug: href, hasSub: audio.includes("sub"), hasDub: audio.includes("dub") });
  }
  episodes.sort((a, b) => a.number - b.number);
  const seen = new Set();
  return episodes.filter((e) => seen.has(e.number) ? false : (seen.add(e.number), true));
}

async function scrapeEmbed(embedId) {
  const html = await fetchHtml(`${BASE}/embed/${embedId}`, { Referer: BASE });
  const m = html.match(/var\s+videoSources\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) return [];
  let parsed = [];
  try {
    const asJson = m[1]
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"');
    parsed = JSON.parse(asJson);
  } catch {
    return [];
  }
  return parsed.map((s) => {
    let backup = null;
    if (s.bk) {
      try { backup = decodeURIComponent(atob(s.bk)); }
      catch { backup = null; }
    }
    return {
      quality: s.label || "unknown",
      url: s.file ? (s.file.startsWith("http") ? s.file : `${BASE}${s.file}`) : "",
      backup,
    };
  }).filter((s) => s.url);
}

async function scrapeEpisodeWatch(epSlug, audio) {
  const html = await fetchHtml(`${BASE}/${epSlug}`, { Referer: BASE });
  const title = stripTags(html.match(/<div\b[^>]*class=["'][^"']*info[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "");
  const tabs = [];
  for (const m of html.matchAll(/<a\b[^>]*data-toggle=["']tab["'][^>]*>/gi)) {
    const tag = m[0];
    const embedId = attr(tag, "data-id");
    const server = attr(tag, "data-mirror") || "AnimeGG";
    const version = attr(tag, "data-version") || "subbed";
    if (!embedId) continue;
    const normalized = version.startsWith("dub") ? "dub" : "sub";
    if (audio === "all" || normalized === audio) {
      tabs.push({ embedId, embedUrl: `${BASE}/embed/${embedId}`, server, normalized });
    }
  }
  const results = await Promise.allSettled(tabs.map(async (tab, i) => {
    const sources = await scrapeEmbed(tab.embedId);
    const streams = sources.map((s, j) => ({
      url: s.url,
      type: s.url.includes(".m3u8") ? "hls" : "mp4",
      quality: s.quality,
      backup: s.backup,
      audio: tab.normalized,
      server: tab.server,
      embed: tab.embedUrl,
      referer: `${new URL(tab.embedUrl).origin}/`,
      priority: tabs.length - i,
      isActive: i === 0 && j === 0,
    }));
    streams.push({
      url: tab.embedUrl,
      type: "embed",
      audio: tab.normalized,
      server: `${tab.server}-embed`,
      referer: `${new URL(tab.embedUrl).origin}/`,
      priority: 1,
      isActive: false,
    });
    return streams;
  }));
  return { title, streams: results.flatMap((r) => r.status === "fulfilled" ? r.value : []) };
}

async function searchFn(query) {
  const r1 = await search(query);
  // AnimeGG needs a plain alphanumeric token to surface all season variants.
  // "Re:Zero" → 0 results; "ReZero" → all slugs including season-4.
  const compact = query.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 4 && compact.toLowerCase() !== query.toLowerCase()) {
    try {
      const r2 = await search(compact);
      const seen = new Set(r1.map(r => r.slug));
      r2.forEach(r => { if (!seen.has(r.slug)) r1.push(r); });
    } catch {}
  }
  return r1;
}

async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:match2:animegg:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;

  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  const candidates = await findTopSlugs(titles, searchFn);
  const expected = expectedCount(media, ctx.anizip);
  const offset = await getPrequelOffset(anilistId).catch(() => 0);
  const isSingleMovie = String(media?.format ?? "").toUpperCase() === "MOVIE" || expected === 1;
  const selected = await selectSeries(candidates, scrapeSeries, expected, media?.status, offset, {
    minScore: isSingleMovie ? 0.9 : 0.65,
  });
  if (!selected) throw new Error(`AnimeGG match not found for AniList ${anilistId}`);
  const data = { slug: selected.slug, title: selected.title, mode: selected.mode, offset, score: selected.score };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}

function buildEpisodeLists(anilistId, series, providerEpisodes, ctx, expected) {
  const sub = [], dub = [];
  for (const src of providerEpisodes) {
    const number = series.mode === "offset" ? src.number - series.offset : src.number;
    if (number < 1) continue;
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? src.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber: src.number,
    };
    if (src.hasSub) sub.push({ ...base, id: `watch/animegg/${anilistId}/sub/animegg-${number}`, audio: "sub" });
    if (src.hasDub) dub.push({ ...base, id: `watch/animegg/${anilistId}/dub/animegg-${number}`, audio: "dub" });
  }
  return { sub, dub };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries(anilistId, localCtx);
  const episodes = await scrapeSeries(series.slug);
  const expected = expectedCount(media, ctx.anizip);
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "animegg",
      matchScore: Number(series.score.toFixed(3)),
      numbering: series.mode,
      episodeOffset: series.mode === "offset" ? series.offset : 0,
    },
    episodes: buildEpisodeLists(anilistId, series, episodes, localCtx, expected),
  };
}

async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  const series = await resolveSeries(anilistId, ctx);
  const providerEp = series.mode === "offset" ? Number(epNum) + series.offset : Number(epNum);
  const episodes = await scrapeSeries(series.slug);
  const ep = episodes.find((e) => e.number === providerEp);
  if (!ep) return json({ error: `AnimeGG episode ${providerEp} not found` }, 404);
  const watch = await scrapeEpisodeWatch(ep.epSlug, audio);
  return json({ anilistId: Number(anilistId), episode: Number(epNum), providerEpisode: providerEp, audio, title: watch.title, streams: watch.streams });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      const m = url.pathname.match(/^\/watch\/animegg\/(\d+)\/(sub|dub)\/animegg-(\d+)\/?$/);
      if (m) return await handleWatch(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  },
};
