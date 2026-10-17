import { json, episodeMeta }                                  from "../core/new-provider-utils.js";
import { getMedia }                                        from "../core/anilist.js";
import { get as cacheGet, set as cacheSet, isFresh,
         SHOW_IDENTITY_TTL }                               from "../core/smartcache.js";
import { wreqFetch }                                       from "../core/wreq.js";

const BASE = "https://senshi.to";
const VID_CLOUD = "https://s.vidcloud.se";
const UA   = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const H    = { "User-Agent": UA, "Referer": `${BASE}/` };
const SENSHI_WREQ_BROWSER = process.env.SENSHI_WREQ_BROWSER || "chrome_149";
const SENSHI_WREQ_OS = process.env.SENSHI_WREQ_OS || "windows";

async function fetchEpisodeList(malId) {
  const res = await fetch(`${BASE}/episodes/${malId}`, { headers: H });
  if (!res.ok) throw new Error(`Senshi episodes ${res.status} (MAL ${malId})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchEmbeds(malId, epNum) {
  const res = await fetch(`${BASE}/episode-embeds/${malId}/${epNum}`, { headers: H });
  if (!res.ok) throw new Error(`Senshi embeds ${res.status} (MAL ${malId} ep ${epNum})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function resolveMalId(anilistId) {
  const cacheKey = `np:senshi:${anilistId}`;
  const cached   = cacheGet(cacheKey);
  if (isFresh(cached)) return cached.data;

  const media = await getMedia(anilistId);
  if (!media?.idMal) throw new Error(`Senshi: no MAL ID found for AniList ${anilistId}`);

  cacheSet(cacheKey, media.idMal, SHOW_IDENTITY_TTL);
  return media.idMal;
}

function isDub(status) {
  return (status ?? "").toLowerCase() === "dub";
}

function sourceAudioMatches(entry, audio) {
  const sourceAudio = entry?.source?.audio;
  if (!sourceAudio) return true;
  const normalized = sourceAudio.toLowerCase();
  return normalized === "both" || normalized === audio;
}

function mapTrack(track) {
  const url = track?.vtt_url || track?.url;
  if (!url) return null;
  const label = track.label || "English";
  if (label.toLowerCase() === "chapter") return null;
  const lang = label.toLowerCase().split(/\s+/)[0];
  return {
    url,
    label,
    srclang: lang === "english" ? "en" : lang.slice(0, 2),
    default: Boolean(track.default),
  };
}

async function fetchVidCloudSources(remoteSourceId) {
  if (!remoteSourceId) return [];
  const url = `${VID_CLOUD}/_v1/sources?id=${encodeURIComponent(remoteSourceId)}`;
  const headers = {
    "User-Agent": UA,
    "Accept": "application/json,*/*",
    "Origin": BASE,
    "Referer": `${BASE}/`,
  };

  let res;
  try {
    res = await wreqFetch(url, {
      session: "senshi",
      browser: SENSHI_WREQ_BROWSER,
      os: SENSHI_WREQ_OS,
      headers,
    });
  } catch {
    res = await fetch(url, { headers });
  }

  if (!res.ok) throw new Error(`Senshi vidcloud ${res.status} (source ${remoteSourceId})`);
  const data = await res.json();
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function getEpisodes(anilistId, ctx = {}) {
  const malId = await resolveMalId(anilistId);
  const items = await fetchEpisodeList(malId);

  if (!items.length) {
    throw new Error(`Senshi: no episodes for AniList ${anilistId} (MAL ${malId})`);
  }

  let hasDub = false;
  try {
    const probe = await fetchEmbeds(malId, 1);
    hasDub = probe.some(e => isDub(e.status));
  } catch { /* ignore */ }

  const sub = [];
  const dub = [];

  for (const item of items) {
    const num  = item.ep_id;
    const meta = episodeMeta(num, ctx);
    const title = item.ep_title || meta.title || `Episode ${num}`;
    const duration = meta.duration;
    const filler = item.ep_filler || meta.filler || false;
    const recap = item.ep_recap || false;
    const description = meta.description;
    const image = item.ep_thumbnail || meta.image;
    const airDate = meta.airDate;

    sub.push({
      id: `watch/senshi/${anilistId}/sub/senshi-${num}`,
      number: num,
      title,
      duration,
      audio: "sub",
      filler,
      recap,
      uncensored: false,
      description,
      image,
      airDate
    });

    if (hasDub) {
      dub.push({
        id: `watch/senshi/${anilistId}/dub/senshi-${num}`,
        number: num,
        title,
        duration,
        audio: "dub",
        filler,
        recap,
        uncensored: false,
        description,
        image,
        airDate
      });
    }
  }

  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);

  return {
    meta: {
      title:  ctx.media?.title?.english ?? ctx.media?.title?.romaji ?? null,
      malId,
      source: "senshi",
    },
    episodes: { sub, dub },
  };
}

async function handleWatch(anilistId, audio, epNum) {
  const malId  = await resolveMalId(anilistId);
  const embeds = await fetchEmbeds(malId, epNum);

  if (!embeds.length) {
    return json({ error: `Senshi: no sources for episode ${epNum}` }, 404);
  }

  const wantDub = audio === "dub";
  const source  = embeds.find(e => wantDub ? isDub(e.status) : !isDub(e.status));

  if (!source) {
    return json({ error: `Senshi: no ${audio} source for episode ${epNum}` }, 404);
  }

  const list = await fetchEpisodeList(malId).catch(() => []);
  const epItem = list.find(item => Number(item.ep_id) === Number(epNum));

  const intro = {
    start: epItem?.intro_start ?? 0,
    end: epItem?.intro_end ?? 0,
  };
  const outro = {
    start: epItem?.outro_start ?? 0,
    end: epItem?.outro_end ?? 0,
  };

  const streams   = [];
  const downloads = [];
  const subtitles = [];

  if (source.remote_source_id) {
    const vidCloudSources = await fetchVidCloudSources(source.remote_source_id).catch(() => []);
    const usableSources = vidCloudSources.filter(entry => entry?.source?.src && sourceAudioMatches(entry, audio));
    for (const entry of usableSources) {
      const itemSubs = [];
      for (const track of entry.tracks || []) {
        const mapped = mapTrack(track);
        if (!mapped) continue;
        itemSubs.push(mapped);
        if (!subtitles.some(sub => sub.url === mapped.url)) subtitles.push(mapped);
      }

      streams.push({
        url:      entry.source.src,
        type:     "hls",
        server:   "Senshi",
        referer:  `${BASE}/`,
        quality:  entry.source.quality || null,
        subtitles: itemSubs,
        fonts:    Array.isArray(entry.font) ? entry.font : [],
        priority: streams.length ? 4 : 5,
        isActive: streams.length === 0,
      });
    }
  }

  if (!streams.length && source.url) {
    streams.push({
      url:      source.url.replace(/^http:\/\//i, "https://"),
      type:     "embed",
      server:   "Senshi",
      referer:  `${BASE}/`,
      priority: 4,
      isActive: true,
    });
  }

  if (source.server2) {
    streams.push({
      url:      source.server2,
      type:     "embed",
      server:   "StreamNin",
      referer:  `${BASE}/`,
      priority: 3,
      isActive: false,
    });
  }

  if (source.serverFM) {
    streams.push({
      url:      source.serverFM,
      type:     "embed",
      server:   "FileMoon",
      referer:  `${BASE}/`,
      priority: 2,
      isActive: false,
    });
  }

  if (source.download) {
    downloads.push({ url: source.download, label: "Download" });
  }

  return json({
    anilistId: Number(anilistId),
    malId,
    episode:   Number(epNum),
    audio,
    intro,
    outro,
    streams,
    subtitles,
    downloads,
    headers:   H,
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
      const m = url.pathname.match(/^\/watch\/senshi\/(\d+)\/(sub|dub)\/senshi-(\d+)\/?$/);
      if (m) return await handleWatch(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  },
};
