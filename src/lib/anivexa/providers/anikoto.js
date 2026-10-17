import { getMedia } from '../core/anilist.js';
import { extractMegaPlayDetails } from "../extractors/megaplay.js";
import { buildTitleSearchQueries, buildTitles, decodeEntities, titleIdentityScore } from "../core/new-provider-utils.js";

const ANIKOTO = "https://anikototv.to";
const MAPPER = "https://mapper.nekostream.site/api/mal";
const ANIZIP = "https://api.ani.zip/mappings";
const SPOOF_REF = "https://hianimes.re/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const LANG_MAP = {
  en: "en", english: "en", ja: "ja", japanese: "ja",
  fr: "fr", french: "fr", de: "de", german: "de",
  es: "es", spanish: "es", pt: "pt", portuguese: "pt"
};

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function httpGet(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*", ...headers } });
  if (!res.ok) {
    const _raw = await res.text().catch(() => null);
    const _e = new Error(`HTTP ${res.status} fetching ${url}`);
    _e.rawBody = _raw;
    throw _e;
  }
  return res.text();
}

async function getJSON(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json,*/*", ...headers } });
  if (!res.ok) {
    const _raw = await res.text().catch(() => null);
    const _e = new Error(`HTTP ${res.status} fetching ${url}`);
    _e.rawBody = _raw;
    throw _e;
  }
  return res.json();
}

const MODIFIERS = [
  "ova", "movie", "special", "specials", "tales", "journal", "part", "season", "kanwa", "spin-off", "theatre"
];

function scoreCandidate(cand, primaryEn, primaryRom, synonyms) {
  let score = 0;
  const candNameNorm = normalize(cand.name);
  const candJpNorm   = normalize(cand.jp);
  const candSlugNorm = normalize(cand.slug);

  const normEn  = normalize(primaryEn);
  const normRom = normalize(primaryRom);

  if (normEn && candNameNorm === normEn) score += 1000;
  if (normRom && candNameNorm === normRom) score += 900;
  if (normRom && candJpNorm === normRom) score += 800;

  const targetText = `${primaryEn || ""} ${primaryRom || ""} ${(synonyms || []).join(" ")}`.toLowerCase();
  
  for (const mod of MODIFIERS) {
    const candHasMod = candNameNorm.includes(mod) || candSlugNorm.includes(mod);
    const targetHasMod = targetText.includes(mod);
    if (candHasMod && !targetHasMod) {
      score -= 300;
    }
  }

  for (const t of [primaryEn, primaryRom, ...(synonyms || [])]) {
    const normT = normalize(t);
    if (!normT || normT.length < 3) continue;

    if (candNameNorm === normT) score += 200;
    else if (candNameNorm.startsWith(normT) || normT.startsWith(candNameNorm)) score += 80;
    else if (candNameNorm.includes(normT) || normT.includes(candNameNorm)) score += 40;

    if (candJpNorm && candJpNorm === normT) score += 100;
  }

  const lengthDiff = Math.abs(candNameNorm.length - (normEn || normRom || "").length);
  score -= lengthDiff * 2;

  return score;
}

async function searchAnikoto(query) {
  const searchHtml = await httpGet(`${ANIKOTO}/filter?keyword=${encodeURIComponent(query)}`, { Referer: `${ANIKOTO}/` });
  const candidates = [];
  
  const re = /<a\s+class="name d-title"\s+href="https:\/\/anikototv\.to\/watch\/([^"/]+)(?:\/ep-\d+)?"[^>]*data-jp="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(searchHtml)) !== null) {
    const slug = m[1];
    const jp = decodeEntities(m[2].trim());
    const name = decodeEntities(m[3].replace(/<[^>]*>/g, "").trim());
    candidates.push({ slug, name, jp });
  }

  if (!candidates.length) {
    const reFallback = /<a\s+href="https:\/\/anikototv\.to\/watch\/([^"/]+)(?:\/ep-\d+)?"[^>]*>([\s\S]*?)<\/a>/g;
    while ((m = reFallback.exec(searchHtml)) !== null) {
      candidates.push({ slug: m[1], name: m[1], jp: "" });
    }
  }

  const seen = new Set();
  return candidates.filter(c => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });
}

function parseEpisodeRows(html) {
  const rows = [];
  const re = /<a\s+[^>]*data-id="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(re)) {
    const tag = match[0];
    const getAttr = (name) => tag.match(new RegExp(`data-${name}="([^"]*)"`))?.[1] ?? "";
    const number = Number.parseInt(getAttr("num"), 10);
    if (!Number.isInteger(number)) continue;
    const title = decodeEntities(match[2].match(/<span\s+class="d-title"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() ?? "");
    rows.push({
      number,
      ids: getAttr("ids"),
      hasSub: getAttr("sub") === "1",
      hasDub: getAttr("dub") === "1",
      malId: Number.parseInt(getAttr("mal"), 10) || null,
      slug: getAttr("slug"),
      timestamp: getAttr("timestamp"),
      title: title || `Episode ${number}`,
    });
  }
  return rows;
}

async function inspectAnikotoCandidate(candidate) {
  const watchHtml = await httpGet(`${ANIKOTO}/watch/${candidate.slug}`, { Referer: `${ANIKOTO}/` });
  const showId = watchHtml.match(/data-id="(\d+)"/)?.[1];
  if (!showId) return null;
  const listJson = await getJSON(`${ANIKOTO}/ajax/episode/list/${showId}`, {
    "X-Requested-With": "XMLHttpRequest",
    Referer: `${ANIKOTO}/watch/${candidate.slug}`,
  });
  const episodes = parseEpisodeRows(listJson.result || "");
  return episodes.length ? { ...candidate, showId, episodes } : null;
}

async function findAnikotoShow(media, anizip) {
  const mappings = anizip ?? await getJSON(`${ANIZIP}?anilist_id=${media.id}`).catch(() => null);
  const titles = [...new Set(buildTitles(media, mappings).filter(Boolean))];
  const keywords = buildTitleSearchQueries(titles, 18);
  const allCandidatesMap = new Map();
  for (let index = 0; index < keywords.length; index += 4) {
    const results = await Promise.all(keywords.slice(index, index + 4).map((keyword) => searchAnikoto(keyword).catch(() => [])));
    for (const list of results) for (const candidate of list) allCandidatesMap.set(candidate.slug, candidate);
  }

  const candidates = [...allCandidatesMap.values()].map((candidate) => {
    const titleScore = titleIdentityScore(titles, [candidate.name, candidate.jp, candidate.slug.replace(/-/g, " ")]);
    return { ...candidate, titleScore, legacyScore: scoreCandidate(candidate, media.title?.english, media.title?.romaji, media.synonyms || []) };
  }).filter((candidate) => candidate.titleScore >= 0.28)
    .sort((left, right) => right.titleScore - left.titleScore || right.legacyScore - left.legacyScore)
    .slice(0, 12);

  if (!candidates.length) throw new Error(`No confident Anikoto title candidates for AniList ${media.id}`);
  const inspected = [];
  for (let index = 0; index < candidates.length; index += 4) {
    const batch = await Promise.allSettled(candidates.slice(index, index + 4).map(inspectAnikotoCandidate));
    for (const result of batch) if (result.status === "fulfilled" && result.value) inspected.push(result.value);
  }

  const expectedMal = Number(media.idMal) || null;
  if (expectedMal) {
    const exact = inspected.filter((candidate) => candidate.episodes.some((episode) => episode.malId === expectedMal));
    if (exact.length) {
      const expectedEpisodes = Number(media.episodes) > 0 ? Number(media.episodes) : null;
      const getMatchMetrics = (candidate) => {
        const rows = candidate.episodes.filter((episode) => episode.malId === expectedMal);
        const numbers = new Set(rows.map((episode) => episode.number));
        const expectedRange = expectedEpisodes
          ? new Set(rows.map((episode) => episode.number).filter((number) => number >= 1 && number <= expectedEpisodes)).size
          : 0;
        return {
          completeRange: expectedEpisodes !== null && expectedRange === expectedEpisodes,
          exactCount: expectedEpisodes !== null && numbers.size === expectedEpisodes,
          expectedRange,
          excess: expectedEpisodes === null ? 0 : Math.max(0, numbers.size - expectedEpisodes),
        };
      };
      exact.sort((left, right) => {
        const leftMetrics = getMatchMetrics(left);
        const rightMetrics = getMatchMetrics(right);
        return Number(rightMetrics.completeRange) - Number(leftMetrics.completeRange)
          || Number(rightMetrics.exactCount) - Number(leftMetrics.exactCount)
          || rightMetrics.expectedRange - leftMetrics.expectedRange
          || leftMetrics.excess - rightMetrics.excess
          || right.titleScore - left.titleScore;
      });
      const chosen = exact[0];
      const episodes = chosen.episodes.filter((episode) => episode.malId === expectedMal);
      const numbers = new Set(episodes.map((episode) => episode.number));
      for (const candidate of exact.slice(1)) {
        const rows = candidate.episodes.filter((episode) => episode.malId === expectedMal);
        if (!rows.length || rows.some((episode) => numbers.has(episode.number))) continue;
        for (const episode of rows) {
          numbers.add(episode.number);
          episodes.push(episode);
        }
      }
      episodes.sort((left, right) => left.number - right.number);
      if (expectedEpisodes && episodes.length > expectedEpisodes) {
        const expectedRange = new Map();
        for (const episode of episodes) {
          if (episode.number >= 1 && episode.number <= expectedEpisodes && !expectedRange.has(episode.number)) {
            expectedRange.set(episode.number, episode);
          }
        }
        if (expectedRange.size === expectedEpisodes) {
          episodes.splice(0, episodes.length, ...[...expectedRange.values()].sort((left, right) => left.number - right.number));
        }
      }
      return { ...chosen, title: chosen.name, episodes, malId: expectedMal };
    }
  }

  const viable = inspected.filter((candidate) => {
    const hasProviderMal = candidate.episodes.some((episode) => episode.malId);
    return candidate.titleScore >= 0.72 && (!expectedMal || !hasProviderMal);
  }).sort((left, right) => right.titleScore - left.titleScore || right.legacyScore - left.legacyScore);
  const chosen = viable[0];
  const runnerUp = viable[1];
  if (!chosen || runnerUp && chosen.titleScore - runnerUp.titleScore < 0.08) {
    throw new Error(`No confident Anikoto identity match for AniList ${media.id}`);
  }
  return { ...chosen, title: chosen.name, malId: expectedMal };
}

function mapTrack(t, source) {
  const label = t.label ?? "";
  const langKey = label.toLowerCase().split(" ")[0];
  return {
    url: t.file,
    label: label || "English",
    srclang: LANG_MAP[langKey] ?? "en",
    default: t.default ?? false,
    source
  };
}

function streamRank(stream) {
  if (stream.type === "hls" && stream.variant === "modern") return 0;
  if (stream.type === "hls") return 1;
  return 2;
}

function subtitleTypeFromServerType(typeName) {
  if (typeName === "hsub") return "hardsub";
  if (typeName === "sub") return "softsub";
  return null;
}

async function extractEmbedSource(embedUrl) {
  try {
    return await extractMegaPlayDetails(embedUrl, { userAgent: UA, referer: SPOOF_REF });
  } catch (e) {
    return null;
  }
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media || await getMedia(anilistId);
  if (!media) throw new Error(`Could not resolve media for AniList ID: ${anilistId}`);

  const anizipRes = ctx.anizip ?? await getJSON(`${ANIZIP}?anilist_id=${anilistId}`).catch(() => null);
  const show = await findAnikotoShow(media, anizipRes);
  const sub = [];
  const dub = [];
  for (const row of show.episodes) {
    const num = row.number;
    const azEp = anizipRes?.episodes?.[String(num)] ?? {};
    const img = azEp.image || null;
    const desc = azEp.overview || azEp.summary || null;
    const airDate = azEp.airDate || azEp.airdate || null;

    const base = {
      number: num,
      title: row.title,
      duration: null,
      filler: false,
      uncensored: false,
      description: desc,
      image: img,
      airDate: airDate
    };

    if (row.hasSub) {
      sub.push({
        id: `watch/anikoto/${anilistId}/sub/anikoto-${num}`,
        ...base,
        audio: "sub"
      });
    }
    if (row.hasDub) {
      dub.push({
        id: `watch/anikoto/${anilistId}/dub/anikoto-${num}`,
        ...base,
        audio: "dub"
      });
    }
  }

  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);

  return {
    meta: {
      title: show.title,
      slug: show.slug,
      malId: show.malId,
      source: "anikoto"
    },
    episodes: { sub, dub }
  };
}

async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  if (audio !== "sub" && audio !== "dub") {
    return jsonResponse({ error: "audio must be sub or dub" }, 400);
  }

  const media = ctx.media || await getMedia(anilistId);
  if (!media) {
    return jsonResponse({ error: `Could not resolve media for AniList ID: ${anilistId}` }, 400);
  }

  const show = await findAnikotoShow(media, ctx.anizip);
  const targetEp = show.episodes.find((episode) => episode.number === Number(epNum) && episode[audio === "sub" ? "hasSub" : "hasDub"]);

  if (!targetEp?.ids) {
    return jsonResponse({ error: `Episode ${epNum} not found for show: ${show.title}` }, 404);
  }

  const malIdNum = targetEp.malId || media.idMal || null;

  const [serverDataRes, mapperRes] = await Promise.allSettled([
    getJSON(`${ANIKOTO}/ajax/server/list?servers=${encodeURIComponent(targetEp.ids)}`, {
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${ANIKOTO}/`
    }),
    (targetEp.malId && targetEp.slug && targetEp.timestamp)
      ? getJSON(`${MAPPER}/${targetEp.malId}/${targetEp.slug}/${targetEp.timestamp}`, { Referer: `${ANIKOTO}/` })
      : Promise.resolve(null)
  ]);

  const serverData = serverDataRes.status === "fulfilled" ? serverDataRes.value : null;
  const mapperData = mapperRes.status === "fulfilled" ? mapperRes.value : null;

  const serverHtml = serverData?.result || "";
  const serverItems = [];
  const downloadItems = [];

  const typeRe = /<div class="type" data-type="([^"]+)">([\s\S]*?)<\/ul>\s*<\/div>/g;
  let typeM;
  while ((typeM = typeRe.exec(serverHtml)) !== null) {
    const typeName = typeM[1];
    for (const li of typeM[2].matchAll(/<li\s+([^>]*data-link-id[^>]*)>([\s\S]*?)<\/li>/g)) {
      const linkId = li[1].match(/data-link-id="([^"]+)"/)?.[1];
      const name = li[2].replace(/<[^>]+>/g, "").trim();
      if (!linkId) continue;

      if (typeName === "dl" || name.toLowerCase().includes("download") || name.toLowerCase().includes("kiwi")) {
        downloadItems.push({ linkId, name });
      } else if (typeName === audio || (audio === "sub" && typeName === "hsub")) {
        serverItems.push({ linkId, name, serverType: typeName, subtitleType: subtitleTypeFromServerType(typeName) });
      }
    }
  }

  if (mapperData) {
    for (const [sKey, sObj] of Object.entries(mapperData)) {
      if (sKey === "status") continue;
      const cleanName = sKey.replace(/[-_]+$/, "").trim();
      if (sObj?.[audio]?.url) {
        serverItems.push({
          linkId: sObj[audio].url,
          name: cleanName,
          serverType: audio,
          subtitleType: subtitleTypeFromServerType(audio)
        });
      }
      if (sObj?.[audio]?.download) {
        for (const [dLabel, dUrl] of Object.entries(sObj[audio].download)) {
          if (dUrl && typeof dUrl === "string") {
            downloadItems.push({ url: dUrl, name: cleanName });
          }
        }
      }
    }
  }

  const streams = [];
  const subtitles = [];
  const downloads = [];

  const serverSeen = new Set();
  const subSeen = new Set();
  const dlSeen = new Set();

  for (const item of serverItems) {
    const serverKey = `${item.name}:${item.subtitleType || item.serverType || audio}`;
    if (serverSeen.has(serverKey)) continue;
    serverSeen.add(serverKey);

    const resolved = item.linkId.startsWith("http")
      ? { result: { url: item.linkId } }
      : await getJSON(`${ANIKOTO}/ajax/server?get=${encodeURIComponent(item.linkId)}`, {
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${ANIKOTO}/`
        }).catch(() => null);

    const embedUrl = resolved?.result?.url;
    if (!embedUrl) continue;

    let serverIntro = { start: 0, end: 0 };
    let serverOutro = { start: 0, end: 0 };

    if (resolved?.result?.skip_data?.intro?.length === 2) {
      const [s, e] = resolved.result.skip_data.intro;
      if (s || e) serverIntro = { start: Number(s) || 0, end: Number(e) || 0 };
    }
    if (resolved?.result?.skip_data?.outro?.length === 2) {
      const [s, e] = resolved.result.skip_data.outro;
      if (s || e) serverOutro = { start: Number(s) || 0, end: Number(e) || 0 };
    }

    const hlsSources = [];

    if (embedUrl.includes("#aHR0c")) {
      const b64 = embedUrl.split("#")[1];
      try {
        const decodedUrl = atob(b64);
        if (decodedUrl.includes(".m3u8")) {
          hlsSources.push({ url: decodedUrl, variant: null });
        }
      } catch (e) {}
    }

    const extracted = await extractEmbedSource(embedUrl);
    const itemSubs = [];

    if (extracted?.sources?.length) {
      for (const source of extracted.sources) {
        if (!hlsSources.some((item) => item.url === source.url)) hlsSources.push(source);
      }

      for (const t of extracted.tracks ?? []) {
        const mapped = mapTrack(t, item.name);
        itemSubs.push(mapped);
        if (!subSeen.has(mapped.url)) {
          subSeen.add(mapped.url);
          subtitles.push(mapped);
        }
      }

      if (extracted.intro?.start || extracted.intro?.end) {
        serverIntro = { start: Number(extracted.intro.start) || 0, end: Number(extracted.intro.end) || 0 };
      }
      if (extracted.outro?.start || extracted.outro?.end) {
        serverOutro = { start: Number(extracted.outro.start) || 0, end: Number(extracted.outro.end) || 0 };
      }
    }

    if (hlsSources.length) {
      for (const source of hlsSources) {
        const streamObj = {
          url: source.url,
          type: "hls",
          server: item.name,
          embedUrl,
          referer: extracted?.origin ? `${extracted.origin}/` : `${new URL(embedUrl).origin}/`,
          subtitles: itemSubs,
          priority: streams.length ? 4 : 5,
          isActive: streams.length === 0
        };
        if (item.subtitleType) streamObj.subtitleType = item.subtitleType;
        if (source.variant) streamObj.variant = source.variant;
        if (serverIntro.start || serverIntro.end) streamObj.intro = serverIntro;
        if (serverOutro.start || serverOutro.end) streamObj.outro = serverOutro;
        streams.push(streamObj);
      }
      streams.push({
        url: embedUrl,
        type: "embed",
        server: item.name,
        referer: `${new URL(embedUrl).origin}/`,
        priority: 4,
        isActive: false
      });
      if (item.subtitleType) streams[streams.length - 1].subtitleType = item.subtitleType;
    } else {
      const streamObj = {
        url: embedUrl,
        type: "embed",
        server: item.name,
        referer: `${new URL(embedUrl).origin}/`,
        priority: 4,
        isActive: streams.length === 0
      };
      if (item.subtitleType) streamObj.subtitleType = item.subtitleType;
      if (serverIntro.start || serverIntro.end) streamObj.intro = serverIntro;
      if (serverOutro.start || serverOutro.end) streamObj.outro = serverOutro;
      streams.push(streamObj);
    }
  }

  for (const dl of downloadItems) {
    let dlUrl = dl.url;
    if (!dlUrl && dl.linkId) {
      const resolved = await getJSON(`${ANIKOTO}/ajax/server?get=${encodeURIComponent(dl.linkId)}`, {
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${ANIKOTO}/`
      }).catch(() => null);
      dlUrl = resolved?.result?.url;
    }

    if (dlUrl && !dlSeen.has(dlUrl)) {
      dlSeen.add(dlUrl);
      downloads.push({
        url: dlUrl,
        label: dl.name
      });
    }
  }

  streams.sort((left, right) => streamRank(left) - streamRank(right));
  streams.forEach((stream, index) => {
    stream.priority = index === 0 ? 5 : 4;
    stream.isActive = index === 0;
  });

  return jsonResponse({
    anilistId: parseInt(anilistId),
    malId: malIdNum,
    episode: epNum,
    audio,
    streams,
    subtitles,
    downloads,
    headers: {
      "User-Agent": UA,
      "Referer": streams[0]?.referer || "https://anikototv.to/"
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
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
    try {
      let m = path.match(/^\/watch\/anikoto\/(\d+)\/(sub|dub)\/anikoto-(\d+)\/?$/);
      if (m) return await handleWatch(m[1], m[2], parseInt(m[3]));

      m = path.match(/^\/episodes\/anikoto\/(\d+)\/?$/);
      if (m) {
        const data = await getEpisodes(parseInt(m[1]));
        return jsonResponse(data);
      }
      return jsonResponse({ error: "Not found" }, 404);
    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500);
    }
  }
};
