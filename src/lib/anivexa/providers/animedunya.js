import child_process from "node:child_process";
import { json, episodeMeta } from "../core/new-provider-utils.js";
import { getMedia } from "../core/anilist.js";
import { get as cacheGet, set as cacheSet, isFresh, SHOW_IDENTITY_TTL } from "../core/smartcache.js";

const BASE = "https://anime-dunya.com";

async function resolveMalId(anilistId) {
  const cacheKey = `np:animedunya:${anilistId}`;
  const cached = cacheGet(cacheKey);
  if (isFresh(cached)) return cached.data;

  const media = await getMedia(anilistId);
  if (!media?.idMal) throw new Error("AnimeDunya: no MAL ID found");

  cacheSet(cacheKey, media.idMal, SHOW_IDENTITY_TTL);
  return media.idMal;
}

function fetchHtml(url) {
  const cmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
  return child_process.execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
}

function extractEpisodesList(html) {
  const match = html.match(/\\?"episodes\\?":\s*\[/);
  if (!match) return [];
  const idx = match.index;
  const matchLen = match[0].length;
  let braceCount = 1;
  let result = "[";
  for (let i = idx + matchLen; i < html.length; i++) {
    const char = html[i];
    if (char === "[") braceCount++;
    else if (char === "]") braceCount--;
    result += char;
    if (braceCount === 0) break;
  }
  try {
    const cleanStr = result.replace(/\\u0026/g, "&").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return JSON.parse(cleanStr);
  } catch (e) {
    return [];
  }
}

function extractStream(html) {
  const match = html.match(/\\?"stream\\?":\s*/);
  if (!match) return null;
  const idx = match.index;
  const matchLen = match[0].length;
  let braceCount = 0;
  let started = false;
  let result = "";
  for (let i = idx + matchLen; i < html.length; i++) {
    const char = html[i];
    if (char === "{") {
      braceCount++;
      started = true;
    } else if (char === "}") {
      braceCount--;
    }
    if (started) {
      result += char;
      if (braceCount === 0) break;
    }
  }
  try {
    const cleanStr = result.replace(/\\u0026/g, "&").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return JSON.parse(cleanStr);
  } catch (e) {
    const sourceMatch = html.match(/"source"\s*:\s*"([^"]+)"/);
    if (sourceMatch) {
      return { source: sourceMatch[1].replace(/\\/g, "") };
    }
    return null;
  }
}

export async function getEpisodes(anilistId, ctx = {}) {
  const malId = await resolveMalId(anilistId);
  const html = fetchHtml(`${BASE}/en/anime/${malId}`);
  if (!html) throw new Error("AnimeDunya: episodes fetch failed");

  let cdnBase = "https://cdn.anime-dunya.com/thumbnail/";
  let cdnExt = "small.jpg";

  const thumbMatch = html.match(/(https?:\/\/[^\s"'`<>]+?\/thumbnail\/)([a-zA-Z0-9]+?)\/((?:small|large)\.jpg)/);
  if (thumbMatch) {
    cdnBase = thumbMatch[1];
    cdnExt = thumbMatch[3];
  }

  const episodes = extractEpisodesList(html);
  const watchable = episodes.filter(ep => ep.streamId !== null && ep.streamId !== undefined);
  const sub = [];

  for (const ep of watchable) {
    const epNum = ep.episodeNumber;
    const meta = episodeMeta(epNum, ctx);
    const customTitle = Array.isArray(ep.translations)
      ? ep.translations.find(t => t.language === "en")?.title
      : ep.translations?.title;
    sub.push({
      id: `watch/animedunya/${anilistId}/sub/animedunya-${epNum}`,
      number: epNum,
      title: customTitle || meta.title || `Episode ${epNum}`,
      duration: meta.duration,
      audio: "sub",
      filler: ep.filler || meta.filler || false,
      uncensored: false,
      description: meta.description,
      image: ep.streamId ? `${cdnBase}${ep.streamId}/${cdnExt}` : meta.image,
      airDate: meta.airDate
    });
  }

  sub.sort((a, b) => a.number - b.number);

  return {
    meta: {
      title: ctx.media?.title?.english ?? ctx.media?.title?.romaji ?? null,
      malId,
      source: "animedunya"
    },
    episodes: { sub, dub: [] }
  };
}

async function handleWatch(anilistId, audio, epNum) {
  const malId = await resolveMalId(anilistId);
  const html = fetchHtml(`${BASE}/en/play/${malId}/${epNum}`);
  if (!html) return json({ error: "AnimeDunya watch fetch failed" }, 500);

  const streamData = extractStream(html);
  if (!streamData || !streamData.source) {
    return json({ error: "AnimeDunya: stream source not found" }, 404);
  }

  const subtitles = (streamData.subtitles || []).map(s => ({
    url: s.src,
    label: s.label,
    srclang: s.srclang,
    default: s.default || false
  }));

  const streams = [{
    url: streamData.source,
    type: "hls",
    server: "AnimeDunya",
    referer: `${BASE}/`,
    subtitles,
    priority: 5,
    isActive: true
  }];

  return json({
    anilistId: Number(anilistId),
    malId,
    episode: Number(epNum),
    audio,
    streams
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
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/watch\/animedunya\/(\d+)\/(sub|dub)\/animedunya-(\d+)\/?$/);
      if (m) return await handleWatch(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};
