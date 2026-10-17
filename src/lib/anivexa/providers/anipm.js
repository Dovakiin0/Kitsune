import { getMedia } from "../core/anilist.js";
import { buildTitleSearchQueries, buildTitles, episodeMeta, json } from "../core/new-provider-utils.js";
import { get, set, isFresh, SHOW_IDENTITY_TTL } from "../core/smartcache.js";
import { wreqFetch } from "../core/wreq.js";

const SITE = "https://ani.pm";
const EMBED = "https://embed.settlar.io";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const BROWSER = process.env.ANIPM_WREQ_BROWSER || "chrome_149";
const OS = process.env.ANIPM_WREQ_OS || "windows";

function requestHeaders(referer = `${SITE}/`) {
  return {
    "User-Agent": UA,
    Accept: "application/json, text/plain, */*",
    Referer: referer,
    Origin: new URL(referer).origin,
  };
}

async function wreq(url, options = {}) {
  return wreqFetch(url, {
    session: "anipm",
    browser: BROWSER,
    os: OS,
    ...options,
  });
}

async function requestJson(url, referer = `${SITE}/`) {
  const response = await wreq(url, { headers: requestHeaders(referer) });
  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`Ani.pm HTTP ${response.status}: ${raw.slice(0, 400)}`);
    error.status = response.status;
    error.rawBody = raw.slice(0, 2000);
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Ani.pm returned invalid JSON");
    error.rawBody = raw.slice(0, 2000);
    throw error;
  }
}

function titleVariants(media, anizip) {
  return [...new Set(buildTitles(media, anizip).map((value) => String(value).trim()).filter(Boolean))];
}

function identityMatches(candidate, media) {
  const aid = Number(candidate?.anilistId) || null;
  const mal = Number(candidate?.malId) || null;
  const expectedAid = Number(media?.id) || null;
  const expectedMal = Number(media?.idMal) || null;
  if (aid && expectedAid && aid !== expectedAid) return false;
  if (mal && expectedMal && mal !== expectedMal) return false;
  return Boolean((aid && expectedAid && aid === expectedAid) || (mal && expectedMal && mal === expectedMal));
}

function verifyBootstrap(data, media) {
  const core = data?.core ?? data?.anime ?? data?.data?.core;
  if (!core) throw new Error("Ani.pm bootstrap did not include anime metadata");
  const aid = Number(core.anilistId) || null;
  const mal = Number(core.malId) || null;
  const expectedAid = Number(media?.id) || null;
  const expectedMal = Number(media?.idMal) || null;
  if (!(aid && expectedAid && aid === expectedAid) && !(mal && expectedMal && mal === expectedMal)) {
    throw new Error(`Ani.pm bootstrap identity mismatch for AniList ${expectedAid}`);
  }
  if (aid && expectedAid && aid !== expectedAid) throw new Error(`Ani.pm AniList identity mismatch for ${expectedAid}`);
  if (mal && expectedMal && mal !== expectedMal) throw new Error(`Ani.pm MAL identity mismatch for ${expectedMal}`);
  return core;
}

async function bootstrap(series, episode, audio) {
  const language = audio === "dub" ? "dub" : "sub";
  const url = new URL(`/api/anime/playback-bootstrap/${encodeURIComponent(series.source)}/${encodeURIComponent(series.id)}`, SITE);
  url.searchParams.set("ep", String(episode));
  url.searchParams.set("lang", language);
  url.searchParams.set("routes", "e4");
  return requestJson(url.href);
}

async function resolveSeries(anilistId, ctx = {}) {
  const key = `np:match2:anipm:${anilistId}`;
  const cached = get(key);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = titleVariants(media, ctx.anizip);
  if (!titles.length) throw new Error(`Ani.pm has no AniList titles for ${anilistId}`);
  const candidates = new Map();
  const queries = buildTitleSearchQueries(titles, 16);
  for (let index = 0; index < queries.length; index += 4) {
    const batches = await Promise.all(queries.slice(index, index + 4).map(async (title) => {
      try {
        const url = new URL("/api/anime/search", SITE);
        url.searchParams.set("q", title);
        const result = await requestJson(url.href);
        return Array.isArray(result) ? result : result?.items ?? result?.results ?? result?.data ?? [];
      } catch {
        return [];
      }
    }));
    for (const items of batches) {
      for (const item of items) {
        if (item?.id && identityMatches(item, media)) {
          const source = item.source || item.provider;
          if (source) candidates.set(`${source}:${item.id}`, { id: String(item.id), source: String(source), title: item.title || item.name || "" });
        }
      }
    }
  }
  for (const candidate of candidates.values()) {
    for (const episode of [1]) {
      try {
        const data = await bootstrap(candidate, episode, "sub");
        const core = verifyBootstrap(data, media);
        const episodes = Array.isArray(core.episodes) ? core.episodes : [];
        const series = {
          ...candidate,
          title: core.title || candidate.title,
          episodes,
          packages: data.anipmPackages?.episodes ?? data.packages?.episodes ?? {},
        };
        if (!episodes.length) continue;
        set(key, series, SHOW_IDENTITY_TTL);
        return series;
      } catch {}
    }
  }
  throw new Error(`Ani.pm could not confidently map AniList ${anilistId}`);
}

function episodeNumber(item) {
  return Number(item?.number ?? item?.episode ?? item?.ep ?? item?.id);
}

function hasChannel(series, number, audio, hard = false) {
  const info = series.packages?.[String(number)];
  const flag = `${audio}${hard ? "hard" : ""}`;
  return info?.[flag] === true;
}

function episodeList(anilistId, series, audio, ctx) {
  return series.episodes
    .filter((item) => Number.isInteger(episodeNumber(item)) && hasChannel(series, episodeNumber(item), audio))
    .map((item) => {
      const number = episodeNumber(item);
      const meta = episodeMeta(number, ctx);
      return {
        id: `watch/anipm/${anilistId}/${audio}/anipm-${number}`,
        number,
        sourceNumber: String(item.number ?? item.episode ?? item.ep ?? number),
        title: meta.title ?? item.title ?? `Episode ${number}`,
        duration: meta.duration,
        audio,
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
  const series = await resolveSeries(anilistId, { ...ctx, media });
  const sub = episodeList(anilistId, series, "sub", ctx);
  const dub = episodeList(anilistId, series, "dub", ctx);
  if (!sub.length && !dub.length) throw new Error(`Ani.pm has no episodes for AniList ${anilistId}`);
  return {
    meta: { id: series.id, title: series.title, source: "anipm", numbering: "standard", episodeOffset: 0 },
    episodes: { sub, dub },
  };
}

function mapSubtitles(items, referer) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === "string") return { url: item, label: "Subtitle", srclang: "und", headers: { Referer: referer } };
    const url = item?.url ?? item?.src ?? item?.file;
    if (!url) return null;
    return {
      url,
      label: item.label ?? item.lang ?? item.language ?? "Subtitle",
      srclang: item.srclang ?? item.lang ?? item.language ?? "und",
      default: Boolean(item.default),
      headers: { Referer: referer },
    };
  }).filter(Boolean);
}

async function getChannelUrl(series, episode, audio, channel) {
  const url = new URL("/api/anime/settlar/session", SITE);
  url.searchParams.set("selection", series.selection);
  url.searchParams.set("provider", "anipm");3
  url.searchParams.set("ep", String(episode));
  url.searchParams.set("channel", channel);
  url.searchParams.set("telemetry", "0");
  const result = await requestJson(url.href);
  const embedUrl = result?.embedUrl ?? result?.url;
  if (!embedUrl) throw new Error(`Ani.pm returned no Settlar embed for ${channel}`);
  const embed = new URL(embedUrl);
  const token = embed.searchParams.get("t");
  if (!token) throw new Error(`Ani.pm Settlar embed is missing its session token for ${channel}`);
  const sessionUrl = new URL("/api/embed/session", EMBED);
  sessionUrl.searchParams.set("t", token);
  const response = await wreq(sessionUrl.href, {
    headers: requestHeaders(embed.href),
    warm: [{ url: `${EMBED}/`, headers: { "User-Agent": UA, Referer: embed.href } }],
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Settlar session HTTP ${response.status}: ${raw.slice(0, 350)}`);
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error("Settlar returned invalid session JSON"); }
  const source = data?.source ?? data?.sources?.[0]?.file ?? data?.sources?.[0]?.url;
  if (!source || !/^https?:\/\//i.test(source)) throw new Error(`Settlar returned no playable source for ${channel}`);
  return {
    url: source,
    embedUrl: embed.href,
    referer: `${embed.origin}/`,
    subtitles: mapSubtitles(data.subtitles ?? data.tracks, `${SITE}/`),
    audioLang: data.audioLang ?? data.audio ?? null,
  };
}

async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const series = await resolveSeries(anilistId, { ...ctx, media });
  const initial = await bootstrap(series, epNum, audio);
  const core = verifyBootstrap(initial, media);
  const episodes = Array.isArray(core.episodes) ? core.episodes : series.episodes;
  const providerEpisode = episodes.find((item) => episodeNumber(item) === Number(epNum));
  const packageInfo = initial.anipmPackages?.episodes?.[String(epNum)] ?? initial.packages?.episodes?.[String(epNum)] ?? series.packages?.[String(epNum)];
  if (!providerEpisode || packageInfo?.[audio] !== true) throw new Error(`Ani.pm ${audio} episode ${epNum} is unavailable`);
  const selection = initial.settlarSelection;
  if (!selection) throw new Error("Ani.pm bootstrap is missing Settlar selection data");
  const currentSeries = { ...series, selection };
  const channels = [audio, ...(packageInfo?.[`${audio}hard`] === true ? [`${audio}hard`] : [])];
  const streams = [];
  for (const channel of channels) {
    try {
      const resolved = await getChannelUrl(currentSeries, epNum, audio, channel);
      streams.push({
        url: resolved.url,
        type: "hls",
        server: "Ani.pm",
        referer: resolved.referer,
        embed: resolved.embedUrl,
        subtitleType: channel.endsWith("hard") ? "hardsub" : "softsub",
        audioLang: resolved.audioLang,
        subtitles: resolved.subtitles,
        priority: channel.endsWith("hard") ? 4 : 5,
        isActive: streams.length === 0,
      });
    } catch (error) {
      if (channel === audio) throw error;
    }
  }
  return json({
    anilistId: Number(anilistId),
    episode: Number(epNum),
    providerEpisode: Number(epNum),
    audio,
    intro: null,
    outro: null,
    streams,
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    const match = new URL(request.url).pathname.match(/^\/watch\/anipm\/(\d+)\/(sub|dub)\/anipm-(\d+)\/?$/);
    if (!match) return json({ error: "Not found" }, 404);
    try {
      return await handleWatch(match[1], match[2], match[3]);
    } catch (error) {
      return json({ error: error.message, "Raw-ERROR": error.rawBody ?? null, stack: error.stack }, error.status ?? 500);
    }
  },
};
