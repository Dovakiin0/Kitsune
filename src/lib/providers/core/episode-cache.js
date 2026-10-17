import { forgetMedia, getMedia } from "./anilist.js";
import { mapAnimeIds } from "./mapper.js";
import { buildEpisodesWithCache, buildFilteredEpisodesWithCache } from "./episode-strategy.js";
import { get, set, getAsync, setAsync, needsRefresh, delAsync, delByPrefixAsync } from "./smartcache.js";

const ANIZIP = "https://api.ani.zip/mappings";
const MIN = 60_000;
const HOUR = 60 * MIN;
const FULL_TTL = 2 * HOUR;
const NORMAL_PROBE_INTERVAL = 30 * MIN;
const AIRING_PROBE_INTERVAL = 5 * MIN;
const AIRING_EARLY_WINDOW = 10 * MIN;
const AIRING_FAST_WINDOW = 6 * HOUR;

const refreshing = new Set();
const episodesInflight = new Map();

function runBackground(env, promise) {
  const waitUntil = env?.context?.waitUntil ?? env?.waitUntil;
  if (typeof waitUntil === "function") waitUntil.call(env.context ?? env, promise);
  else promise.catch(() => {});
}

function latestEpisodeFromResponse(data) {
  let max = 0;
  for (const provider of Object.values(data ?? {})) {
    const episodes = provider?.episodes;
    if (!episodes || typeof episodes !== "object") continue;
    for (const list of Object.values(episodes)) {
      if (!Array.isArray(list)) continue;
      for (const ep of list) {
        const n = Number(ep?.number);
        if (Number.isFinite(n) && n > max) max = n;
      }
    }
  }
  return max || null;
}

function hasCurrentProviders(data) {
  return data &&
    Object.prototype.hasOwnProperty.call(data, "anizone") &&
    Object.prototype.hasOwnProperty.call(data, "aniwaves") &&
    Object.prototype.hasOwnProperty.call(data, "animeonsen") &&
    Object.prototype.hasOwnProperty.call(data, "anipm") &&
    !Object.prototype.hasOwnProperty.call(data, "anihq");
}

function latestEpisodeFromAniZip(anizip) {
  const nums = Object.keys(anizip?.episodes ?? {}).map(Number).filter(Number.isFinite);
  return nums.length ? Math.max(...nums) : null;
}

function resolveShared(anilistId, freshMedia = false) {
  if (freshMedia) forgetMedia(anilistId);
  return Promise.all([
    getMedia(anilistId).catch(() => null),
    fetch(`${ANIZIP}?anilist_id=${anilistId}`).then((r) => r.json()).catch(() => null),
  ]);
}

async function clearProviderCache(anilistId, media) {
  for (const p of ["pahe", "manga", "mkissa", "reanime", "anikoto", "animegg", "anizone", "aniwaves", "animeonsen", "anipm"]) {
    await delAsync(`epv:${p}:${anilistId}`);
    if (p === "reanime" || p === "anikoto") {
      await delAsync(`epv:${p}:v2:${anilistId}`);
    }
    await delAsync(`epv:match2:${p}:${anilistId}`);
  }
  if (media?.idMal) {
    await delAsync(`jm:${media.idMal}`);
    await delByPrefixAsync(`jp:${media.idMal}:`);
  }
}

function buildActiveProvidersMap(providerResult) {
  const providers = {};
  for (const [name, entry] of Object.entries(providerResult ?? {})) {
    if (!entry || typeof entry !== "object" || entry.error) continue;
    const subLen = Array.isArray(entry.episodes?.sub) ? entry.episodes.sub.length : 0;
    const dubLen = Array.isArray(entry.episodes?.dub) ? entry.episodes.dub.length : 0;
    if (subLen > 0 || dubLen > 0) {
      providers[name] = entry;
    }
  }
  return providers;
}

async function buildResponse(anilistId, media, anizip, forceRefresh = false) {
  if (forceRefresh) await clearProviderCache(anilistId, media);

  const [providerResult, mappingResult] = await Promise.all([
    buildEpisodesWithCache(anilistId, media, anizip),
    mapAnimeIds(anilistId).catch(() => null),
  ]);

  const baseMappings = mappingResult?.mappings ?? { id: Number(anilistId), anilistId: Number(anilistId) };
  return {
    page: 1,
    type: "all",
    mappings: {
      ...baseMappings,
      anilistId: Number(anilistId),
      nextAiringEpisode: media?.nextAiringEpisode ?? null,
    },
    providers: buildActiveProvidersMap(providerResult),
    ...providerResult,
  };
}

function probeInterval(state) {
  const airMs = state?.nextAiringAt ? state.nextAiringAt * 1000 : null;
  if (!airMs) return NORMAL_PROBE_INTERVAL;
  const now = Date.now();
  return now >= airMs - AIRING_EARLY_WINDOW && now <= airMs + AIRING_FAST_WINDOW
    ? AIRING_PROBE_INTERVAL
    : NORMAL_PROBE_INTERVAL;
}

function shouldRebuild(entry, media, anizip) {
  if ((media?.status ?? "RELEASING") === "FINISHED") return false;

  const cachedLatest = latestEpisodeFromResponse(entry?.data) ?? 0;
  const knownLatest = Math.max(
    latestEpisodeFromAniZip(anizip) ?? 0,
    Number(media?.episodes) || 0
  );
  if (knownLatest > cachedLatest) return true;

  const next = media?.nextAiringEpisode;
  if (next?.episode && cachedLatest >= Number(next.episode)) return false;
  if (next?.airingAt) {
    const airMs = Number(next.airingAt) * 1000;
    const now = Date.now();
    if (now < airMs - AIRING_EARLY_WINDOW) return false;
    if (now <= airMs + AIRING_FAST_WINDOW) return true;
  }

  return needsRefresh(entry);
}

function writeSyncState(anilistId, state, ttl = FULL_TTL) {
  set(`sync:${anilistId}`, state, ttl, NORMAL_PROBE_INTERVAL);
}

function scheduleRefresh(anilistId, entry, env) {
  const key = `ep-bg:${anilistId}`;
  if (refreshing.has(key)) return;

  const syncKey = `sync:${anilistId}`;
  const oldState = get(syncKey)?.data;
  const now = Date.now();
  if (oldState?.lastProbeAt && now - oldState.lastProbeAt < probeInterval(oldState)) return;

  refreshing.add(key);
  writeSyncState(anilistId, { ...oldState, lastProbeAt: now, syncing: true });

  const task = (async () => {
    const [media, anizip] = await resolveShared(anilistId, true);
    const cachedLatest = latestEpisodeFromResponse(entry?.data);
    const next = media?.nextAiringEpisode ?? null;

    if (!shouldRebuild(entry, media, anizip)) {
      writeSyncState(anilistId, {
        lastProbeAt: Date.now(),
        lastSyncAt: oldState?.lastSyncAt ?? null,
        latestEpisode: cachedLatest,
        nextEpisode: next?.episode ?? null,
        nextAiringAt: next?.airingAt ?? null,
        syncing: false,
      });
      return;
    }

    const result = await buildResponse(anilistId, media, anizip, true);
    const latestEpisode = latestEpisodeFromResponse(result);
    await setAsync(`episodes:match3:${anilistId}`, result, FULL_TTL, NORMAL_PROBE_INTERVAL);
    writeSyncState(anilistId, {
      lastProbeAt: Date.now(),
      lastSyncAt: Date.now(),
      latestEpisode,
      nextEpisode: next?.episode ?? null,
      nextAiringAt: next?.airingAt ?? null,
      syncing: false,
    });
  })()
    .catch((e) => {
      console.error(`[ep-bg:${anilistId}]`, e.message);
      writeSyncState(anilistId, {
        ...oldState,
        lastProbeAt: Date.now(),
        syncing: false,
        error: e.message,
      }, HOUR);
    })
    .finally(() => refreshing.delete(key));

  runBackground(env, task);
}

export async function getEpisodesResponse(anilistId, env) {
  const cacheKey = `episodes:match3:${anilistId}`;
  const entry = await getAsync(cacheKey);

  if (entry && hasCurrentProviders(entry.data)) {
    scheduleRefresh(anilistId, entry, env);
    return entry.data;
  }

  if (episodesInflight.has(cacheKey)) {
    return episodesInflight.get(cacheKey);
  }

  const promise = (async () => {
    const [media, anizip] = await resolveShared(anilistId);
    const result = await buildResponse(anilistId, media, anizip);
    await setAsync(cacheKey, result, FULL_TTL, NORMAL_PROBE_INTERVAL);
    writeSyncState(anilistId, {
      lastProbeAt: Date.now(),
      lastSyncAt: Date.now(),
      latestEpisode: latestEpisodeFromResponse(result),
      nextEpisode: media?.nextAiringEpisode?.episode ?? null,
      nextAiringAt: media?.nextAiringEpisode?.airingAt ?? null,
      syncing: false,
    });
    return result;
  })();

  episodesInflight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    episodesInflight.delete(cacheKey);
  }
}

export async function getFilteredEpisodesResponse(anilistId, providers, includeMap) {
  const [media, anizip] = await resolveShared(anilistId);

  const [providerResult, mappingResult] = await Promise.all([
    buildFilteredEpisodesWithCache(anilistId, providers, media, anizip),
    includeMap ? mapAnimeIds(anilistId).catch(() => null) : Promise.resolve(null),
  ]);

  const baseMappings = mappingResult?.mappings ?? { id: Number(anilistId), anilistId: Number(anilistId) };
  return {
    page: 1,
    type: "filtered",
    ...(includeMap
      ? {
          mappings: {
            ...baseMappings,
            anilistId: Number(anilistId),
            nextAiringEpisode: media?.nextAiringEpisode ?? null,
          },
        }
      : {}),
    providers: buildActiveProvidersMap(providerResult),
    ...providerResult,
  };
}
