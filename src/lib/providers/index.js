import { getMedia }                from "./core/anilist.js";
import { mapAnimeIds }             from "./core/mapper.js";
import mkissaHandler               from "./providers/mkissa.js";
import reanimeHandler              from "./providers/reanime.js";
import anikotoHandler              from "./providers/anikoto.js";
import animeggHandler              from "./providers/animegg.js";
import animenosubHandler           from "./providers/animenosub.js";
import anizoneHandler              from "./providers/anizone.js";
import aniwavesHandler             from "./providers/aniwaves.js";
import senshiHandler               from "./providers/senshi.js";
import kaaHandler                  from "./providers/kickassanime.js";
import animedunyaHandler           from "./providers/animedunya.js";
import animeonsenHandler           from "./providers/animeonsen.js";
import anipmHandler                from "./providers/anipm.js";
import { getEpisodesResponse, getFilteredEpisodesResponse } from "./core/episode-cache.js";
import { resolveProviders }         from "./core/episode-strategy.js";
import { getAsync, setAsync, isFresh, mapTTL, WATCH_TTL, _CACHE_ENABLED } from "./core/smartcache.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Private-Network": "true",
      "Cache-Control": "public, max-age=300",
    },
  });
}

function rewriteRequest(request, newPath) {
  const u = new URL(request.url);
  u.pathname = newPath;
  return new Request(u.toString(), { method: request.method, headers: request.headers });
}

async function fetchAniSkipIntervals(anilistId, epNum) {
  const intro = { start: 0, end: 0 };
  const outro = { start: 0, end: 0 };
  try {
    const media = await getMedia(anilistId).catch(() => null);
    const malId = media?.idMal;
    if (!malId || !epNum) return { intro, outro };
    const res = await fetch(
      `https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types[]=op&types[]=ed&episodeLength=0`,
    ).catch(() => null);
    if (!res?.ok) return { intro, outro };
    const skipJson = await res.json().catch(() => null);
    for (const item of skipJson?.results || []) {
      if (item.skipType === "op" && item.interval) {
        intro.start = Math.floor(item.interval.startTime || 0);
        intro.end = Math.floor(item.interval.endTime || 0);
      } else if (item.skipType === "ed" && item.interval) {
        outro.start = Math.floor(item.interval.startTime || 0);
        outro.end = Math.floor(item.interval.endTime || 0);
      }
    }
  } catch {}
  return { intro, outro };
}

const SUB_LANG_MAP = {
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

function resolveSubLabel(sub, fileUrl) {
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

function normalizeWatchPayload(data, skipTimes) {
  if (!data || typeof data !== "object") return data;
  const streams = Array.isArray(data.streams) ? data.streams : [];
  const rawSubs = [
    ...(Array.isArray(data.subtitles) ? data.subtitles : []),
    ...streams.flatMap((s) => (Array.isArray(s?.subtitles) ? s.subtitles : [])),
  ];
  const seenSubKeys = new Set();
  const rawSubtitles = [];
  for (const sub of rawSubs) {
    const fileUrl = sub?.file || sub?.url;
    if (!fileUrl) continue;
    if (sub?.kind === "thumbnails" || fileUrl.includes("thumbnails")) continue;
    const pathKey = fileUrl.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    if (seenSubKeys.has(pathKey)) continue;
    seenSubKeys.add(pathKey);
    const label = resolveSubLabel(sub, fileUrl);
    rawSubtitles.push({
      file: fileUrl,
      url: fileUrl,
      label,
      lang: label,
      srclang: sub?.srclang || sub?.lang || "en",
      kind: sub?.kind || "captions",
      default: Boolean(sub?.default),
    });
  }

  const labelCounts = {};
  for (const s of rawSubtitles) {
    labelCounts[s.label] = (labelCounts[s.label] || 0) + 1;
  }
  const labelIndex = {};
  const subtitles = rawSubtitles.map((s) => {
    if (labelCounts[s.label] > 1) {
      labelIndex[s.label] = (labelIndex[s.label] || 0) + 1;
      const numbered = `${s.label} ${labelIndex[s.label]}`;
      return { ...s, label: numbered, lang: numbered };
    }
    return s;
  });

  return {
    ...data,
    streams,
    subtitles,
    intro: data.intro ?? skipTimes.intro,
    outro: data.outro ?? skipTimes.outro,
  };
}

const watchInflight = new Map();
const SIGNED_STREAM_WATCH_TTL = 60_000;

async function cachedWatch(cacheKey, handlerFn, ttl = WATCH_TTL) {
  const entry = await getAsync(cacheKey);
  if (entry && isFresh(entry)) return json(entry.data);

  if (watchInflight.has(cacheKey)) {
    await watchInflight.get(cacheKey).catch(() => {});
    const warm = await getAsync(cacheKey);
    if (warm && isFresh(warm)) return json(warm.data);
    return handlerFn();
  }

  const promise = (async () => {
    const response = await handlerFn();
    if (response.status === 200) {
      try {
        const rawData = await response.clone().json();
        const parts = String(cacheKey).split(":");
        const anilistId = Number(parts[2] || rawData?.anilistId) || 0;
        const epNum = Number(parts[4] || rawData?.episode) || 1;
        const skipTimes = await fetchAniSkipIntervals(anilistId, epNum);
        const enriched = normalizeWatchPayload(rawData, skipTimes);
        await setAsync(cacheKey, enriched, ttl);
        return json(enriched, 200);
      } catch {}
    }
    return response;
  })();

  watchInflight.set(cacheKey, promise);
  try   { return await promise; }
  finally { watchInflight.delete(cacheKey); }
}

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Private-Network": "true",
        },
      });
    }

    let m = path.match(/^\/map\/(\d+)\/?$/);
    if (m) {
      const anilistId = m[1];
      const cacheKey  = `map:${anilistId}`;
      const entry     = await getAsync(cacheKey);
      if (entry && isFresh(entry)) return json(entry.data);

      try {
        const [data, media] = await Promise.all([
          mapAnimeIds(anilistId),
          getMedia(anilistId).catch(() => null),
        ]);
        await setAsync(cacheKey, data, mapTTL(media?.status ?? "RELEASING"));
        return json(data);
      } catch (e) {
        if (entry) return json(entry.data);
        return json({ error: e.message }, 500);
      }
    }

    m = path.match(/^\/episodes\/((?:[\w-]+\/)+)(\d+)\/?$/i);
    if (m) {
      const rawNames  = m[1].replace(/\/$/, "").split("/");
      const anilistId = m[2];
      const includeMap = url.searchParams.get("map") !== "false";
      const { resolved, unknown } = resolveProviders(rawNames);

      if (resolved.size === 0) {
        return json({ error: "No valid providers specified", unknown }, 400);
      }

      try {
        const data = await getFilteredEpisodesResponse(anilistId, resolved, includeMap);
        if (unknown.length) data._unknownProviders = unknown;
        return json(data);
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    m = path.match(/^\/episodes\/(\d+)\/?$/);
    if (m) {
      const anilistId = m[1];
      try {
        return json(await getEpisodesResponse(anilistId, env));
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    m = path.match(/^\/watch\/mkissa\/(\d+)\/(sub|dub)\/mkissa-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:mkissa:${id}:${audio}:${ep}`,
        () => mkissaHandler.fetch(request)
      );
    }

    if (path.match(/^\/captcha\/mkissa\/?$/)) {
      return mkissaHandler.fetch(request);
    }

    m = path.match(/^\/watch\/reanime\/(\d+)\/(sub|dub)\/reanime-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:reanime:${id}:${audio}:${ep}`,
        () => reanimeHandler.fetch(rewriteRequest(request, `/watch/${id}/${audio}/${ep}`))
      );
    }

    m = path.match(/^\/stream\/reanime\/(\d+)\/(sub|dub)\/(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return reanimeHandler.fetch(rewriteRequest(request, `/stream/${id}/${audio}/${ep}`));
    }

    m = path.match(/^\/watch\/anikoto\/(\d+)\/(sub|dub)\/anikoto-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:anikoto:${id}:${audio}:${ep}`,
        () => anikotoHandler.fetch(request),
        SIGNED_STREAM_WATCH_TTL
      );
    }

    m = path.match(/^\/watch\/animegg\/(\d+)\/(sub|dub)\/animegg-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:animegg:${id}:${audio}:${ep}`,
        () => animeggHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/animenosub\/(\d+)\/(sub|dub)\/animenosub-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:animenosub:${id}:${audio}:${ep}`,
        () => animenosubHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/anizone\/(\d+)\/(sub|dub)\/anizone-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:anizone:${id}:${audio}:${ep}`,
        () => anizoneHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/aniwaves\/(\d+)\/(sub|dub)\/aniwaves-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:aniwaves:${id}:${audio}:${ep}`,
        () => aniwavesHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/senshi\/(\d+)\/(sub|dub)\/senshi-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:senshi:${id}:${audio}:${ep}`,
        () => senshiHandler.fetch(request),
        SIGNED_STREAM_WATCH_TTL
      );
    }

    m = path.match(/^\/watch\/kaa\/(\d+)\/(sub|dub)\/kaa-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:kaa:${id}:${audio}:${ep}`,
        () => kaaHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/animedunya\/(\d+)\/(sub|dub)\/animedunya-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:animedunya:${id}:${audio}:${ep}`,
        () => animedunyaHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/animeonsen\/(\d+)\/(sub|dub)\/animeonsen-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:animeonsen:${id}:${audio}:${ep}`,
        () => animeonsenHandler.fetch(request)
      );
    }

    m = path.match(/^\/watch\/anipm\/(\d+)\/(sub|dub)\/anipm-(\d+)\/?$/);
    if (m) {
      const [, id, audio, ep] = m;
      return cachedWatch(
        `watch:anipm:${id}:${audio}:${ep}`,
        () => anipmHandler.fetch(request),
        SIGNED_STREAM_WATCH_TTL
      );
    }

    if (path.startsWith("/watch/")) return json({ error: "Not found" }, 404);

    return json({
      name: `Kitsune Provider API ${env?.API_VERSION ?? "unknown"}`,
      cache: _CACHE_ENABLED,
      providers: [
        "mkissa",
        "reanime",
        "anikoto",
        "animegg",
        "animenosub",
        "anizone",
        "aniwaves",
        "senshi",
        "kaa",
        "animedunya",
        "animeonsen",
        "anipm",
      ],
      routes: [
        "/map/:anilistId",
        "/episodes/:anilistId",
        "/episodes/:provider[/:provider...]/:anilistId?map=true|false",
        "/watch/mkissa/:id/sub|dub/mkissa-:ep",
        "/watch/reanime/:id/sub|dub/reanime-:ep",
        "/stream/reanime/:id/sub|dub/:ep",
        "/watch/anikoto/:id/sub|dub/anikoto-:ep",
        "/watch/animegg/:id/sub|dub/animegg-:ep",
        "/watch/animenosub/:id/sub|dub/animenosub-:ep",
        "/watch/anizone/:id/sub|dub/anizone-:ep",
        "/watch/aniwaves/:id/sub|dub/aniwaves-:ep",
        "/watch/senshi/:id/sub|dub/senshi-:ep",
        "/watch/kaa/:id/sub|dub/kaa-:ep",
        "/watch/animedunya/:id/sub|dub/animedunya-:ep",
        "/watch/animeonsen/:id/sub|dub/animeonsen-:ep",
        "/watch/anipm/:id/sub|dub/anipm-:ep",
      ],
    });
  },
};
