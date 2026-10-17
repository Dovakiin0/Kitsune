import { createHash } from "node:crypto";
import { redisGet, redisSet } from "@/lib/redis";
import {
  EpisodeResponse,
  MediaFull,
  MediaList,
  PaginatedResponse,
  ProviderEpisodeItem,
  ScheduleItem,
  SearchSuggestionsResponse,
  WatchSourcesResponse,
} from "@/types/miruro-api";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const MAX_MEM_ENTRIES = 150;
const cache = new Map<string, { data: any; expiresAt: number }>();
const inflight = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DETAIL_TTL_MS = 30 * 60 * 1000; // 30 minutes

function setMemCache(key: string, data: any, expiresAt: number) {
  cache.delete(key);
  if (cache.size >= MAX_MEM_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, expiresAt });
}

export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

const MEDIA_LIST_FRAGMENT = `
  fragment MediaListFields on Media {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      extraLarge
      color
    }
    bannerImage
    format
    season
    seasonYear
    episodes
    duration
    status
    averageScore
    meanScore
    popularity
    favourites
    genres
    source
    countryOfOrigin
    isAdult
    studios(isMain: true) {
      nodes {
        id
        name
        isAnimationStudio
        siteUrl
      }
    }
    nextAiringEpisode {
      episode
      airingAt
      timeUntilAiring
    }
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
  }
`;

export async function anilistQuery<T = any>(
  query: string,
  variables: Record<string, any> = {},
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const rawKey = JSON.stringify({ query: query.trim(), variables });
  const redisKey = `anilist:v2:${createHash("sha1").update(rawKey).digest("hex")}`;
  const now = Date.now();

  const isValidPayload = (d: any): boolean => {
    if (!d || typeof d !== "object") return false;
    if (variables.id !== undefined) {
      return Number(d.Media?.id) === Number(variables.id);
    }
    return Boolean(d.Page || d.Media);
  };

  // 1. Primary cache: Redis (when REDIS_URL is configured and reachable)
  const redisRaw = await redisGet(redisKey);
  if (redisRaw) {
    try {
      const parsed = JSON.parse(redisRaw);
      if (isValidPayload(parsed)) {
        setMemCache(rawKey, parsed, now + ttlMs);
        return parsed as T;
      }
    } catch {
      // Fall through to in-memory / network on malformed payload
    }
  }

  // 2. Fallback cache: In-memory Map
  const hit = cache.get(rawKey);
  if (hit && hit.expiresAt > now && isValidPayload(hit.data)) {
    return hit.data as T;
  }

  if (inflight.has(rawKey)) {
    return inflight.get(rawKey) as Promise<T>;
  }

  const reqPromise = (async (): Promise<T> => {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (res.status === 404) {
      return null as T;
    }

    if (!res.ok) {
      if (hit && isValidPayload(hit.data)) return hit.data as T;
      throw new Error(`AniList API HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.errors?.length && !isValidPayload(json.data)) {
      if (hit && isValidPayload(hit.data)) return hit.data as T;
      throw new Error(json.errors[0]?.message || "AniList GraphQL error");
    }

    if (isValidPayload(json.data)) {
      setMemCache(rawKey, json.data, Date.now() + ttlMs);
      void redisSet(redisKey, JSON.stringify(json.data), ttlMs);
    }
    return json.data as T;
  })();

  inflight.set(rawKey, reqPromise);
  try {
    return await reqPromise;
  } finally {
    inflight.delete(rawKey);
  }
}

export function normalizeMediaList(raw: any): MediaList {
  return {
    id: Number(raw?.id) || 0,
    title: {
      romaji: raw?.title?.romaji || raw?.title?.english || "Untitled",
      english: raw?.title?.english || null,
      native: raw?.title?.native || null,
    },
    coverImage: {
      large: raw?.coverImage?.large || raw?.coverImage?.extraLarge || "",
      extraLarge: raw?.coverImage?.extraLarge || raw?.coverImage?.large || "",
      color: raw?.coverImage?.color || null,
    },
    bannerImage: raw?.bannerImage || null,
    format: raw?.format || "TV",
    season: raw?.season || null,
    seasonYear: raw?.seasonYear ?? raw?.startDate?.year ?? null,
    episodes: raw?.episodes ?? null,
    duration: raw?.duration ?? null,
    status: raw?.status || "FINISHED",
    averageScore: raw?.averageScore ?? null,
    meanScore: raw?.meanScore ?? null,
    popularity: raw?.popularity || 0,
    favourites: raw?.favourites || 0,
    genres: Array.isArray(raw?.genres) ? raw.genres : [],
    source: raw?.source || null,
    countryOfOrigin: raw?.countryOfOrigin || "JP",
    isAdult: Boolean(raw?.isAdult),
    studios: {
      nodes: Array.isArray(raw?.studios?.nodes) ? raw.studios.nodes : [],
    },
    nextAiringEpisode: raw?.nextAiringEpisode || null,
    startDate: raw?.startDate || { year: null, month: null, day: null },
    endDate: raw?.endDate || { year: null, month: null, day: null },
  };
}

export async function fetchMediaPage(options: {
  page?: number;
  perPage?: number;
  sort?: string[];
  status?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
  genre_in?: string[];
  tag_in?: string[];
  search?: string;
}): Promise<PaginatedResponse<MediaList>> {
  const page = Math.max(1, Number(options.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(options.perPage) || 20));

  const query = `
    ${MEDIA_LIST_FRAGMENT}
    query (
      $page: Int
      $perPage: Int
      $sort: [MediaSort]
      $status: MediaStatus
      $season: MediaSeason
      $seasonYear: Int
      $format: MediaFormat
      $genre_in: [String]
      $tag_in: [String]
      $search: String
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          hasNextPage
        }
        media(
          type: ANIME
          isAdult: false
          sort: $sort
          status: $status
          season: $season
          seasonYear: $seasonYear
          format: $format
          genre_in: $genre_in
          tag_in: $tag_in
          search: $search
        ) {
          ...MediaListFields
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: options.sort?.length ? options.sort : ["POPULARITY_DESC"],
  };
  if (options.status) variables.status = options.status;
  if (options.season) variables.season = options.season;
  if (options.seasonYear) variables.seasonYear = options.seasonYear;
  if (options.format) variables.format = options.format;
  if (options.genre_in?.length) variables.genre_in = options.genre_in;
  if (options.tag_in?.length) variables.tag_in = options.tag_in;
  if (options.search) variables.search = options.search;

  const data = await anilistQuery(query, variables);
  const pageInfo = data?.Page?.pageInfo || {};
  const media = (data?.Page?.media || [])
    .map(normalizeMediaList)
    .filter((m: MediaList) => !m.isAdult);

  return {
    page: pageInfo.currentPage || page,
    perPage: pageInfo.perPage || perPage,
    total: pageInfo.total || media.length,
    hasNextPage: Boolean(pageInfo.hasNextPage),
    results: media,
  };
}

export async function fetchSpotlight(): Promise<{ results: MediaList[] }> {
  const pageData = await fetchMediaPage({
    page: 1,
    perPage: 15,
    sort: ["TRENDING_DESC", "POPULARITY_DESC"],
  });
  const withBanner = pageData.results.filter((m) => m.bannerImage || m.coverImage?.extraLarge);
  return { results: withBanner.slice(0, 10) };
}

export async function fetchSchedule(
  dateStr?: string,
  page = 1,
  perPage = 25,
): Promise<PaginatedResponse<ScheduleItem>> {
  let airingAtGreater: number;
  let airingAtLesser: number;

  if (dateStr) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(`${dateStr}T00:00:00Z`)
      : new Date(dateStr);
    const validStart = isNaN(parsed.getTime()) ? new Date() : parsed;
    validStart.setUTCHours(0, 0, 0, 0);
    airingAtGreater = Math.floor(validStart.getTime() / 1000) - 1;
    airingAtLesser = airingAtGreater + 86400;
  } else {
    airingAtGreater = Math.floor(Date.now() / 1000) - 3600;
    airingAtLesser = airingAtGreater + 86400 * 7;
  }

  const query = `
    ${MEDIA_LIST_FRAGMENT}
    query ($page: Int, $perPage: Int, $greater: Int, $lesser: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          hasNextPage
        }
        airingSchedules(
          airingAt_greater: $greater
          airingAt_lesser: $lesser
          sort: [TIME]
        ) {
          id
          episode
          airingAt
          timeUntilAiring
          media {
            ...MediaListFields
          }
        }
      }
    }
  `;

  const data = await anilistQuery(query, {
    page,
    perPage,
    greater: airingAtGreater,
    lesser: airingAtLesser,
  });

  const schedules = data?.Page?.airingSchedules || [];
  const results: ScheduleItem[] = schedules
    .filter((s: any) => s?.media && !s.media.isAdult)
    .map((s: any) => ({
      ...normalizeMediaList(s.media),
      next_episode: s.episode || 1,
      airingAt: s.airingAt || 0,
      timeUntilAiring: s.timeUntilAiring ?? 0,
    }));

  const pageInfo = data?.Page?.pageInfo || {};
  return {
    page: pageInfo.currentPage || page,
    perPage: pageInfo.perPage || perPage,
    total: pageInfo.total || results.length,
    hasNextPage: Boolean(pageInfo.hasNextPage),
    results,
  };
}

export async function fetchSuggestions(q: string): Promise<SearchSuggestionsResponse> {
  if (!q.trim()) return { suggestions: [] };
  const pageData = await fetchMediaPage({
    page: 1,
    perPage: 8,
    search: q.trim(),
    sort: ["SEARCH_MATCH", "POPULARITY_DESC"],
  });

  return {
    suggestions: pageData.results.map((m) => ({
      id: m.id,
      title: m.title.english || m.title.romaji || m.title.native || "Untitled",
      title_romaji: m.title.romaji || null,
      poster: m.coverImage.extraLarge || m.coverImage.large || "",
      format: m.format || null,
      status: m.status || null,
      year: m.seasonYear || m.startDate?.year || null,
      episodes: m.episodes ?? (m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : null),
    })),
  };
}

export async function fetchAnimeInfo(id: number): Promise<MediaFull | null> {
  if (!id || isNaN(id)) return null;

  const query = `
    ${MEDIA_LIST_FRAGMENT}
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ...MediaListFields
        idMal
        description(asHtml: false)
        trending
        hashtag
        synonyms
        siteUrl
        tags {
          name
          rank
          isMediaSpoiler
        }
        trailer {
          id
          site
          thumbnail
        }
        characters(sort: [ROLE, RELEVANCE, ID], perPage: 18) {
          edges {
            role
            node {
              id
              name {
                full
                native
                userPreferred
              }
              image {
                large
                medium
              }
            }
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
              id
              name {
                full
                native
              }
              image {
                large
              }
              languageV2
            }
          }
        }
        staff(perPage: 8) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                large
              }
            }
          }
        }
        relations {
          edges {
            relationType(version: 2)
            node {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                extraLarge
                color
              }
              bannerImage
              format
              type
              status
              episodes
              meanScore
              averageScore
              popularity
              startDate {
                year
                month
                day
              }
            }
          }
        }
        recommendations(sort: [RATING_DESC], perPage: 14) {
          nodes {
            rating
            mediaRecommendation {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                extraLarge
                color
              }
              bannerImage
              format
              episodes
              status
              meanScore
              averageScore
              popularity
              genres
              startDate {
                year
              }
            }
          }
        }
        externalLinks {
          url
          site
          type
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        stats {
          scoreDistribution {
            score
            amount
          }
          statusDistribution {
            status
            amount
          }
        }
      }
    }
  `;

  const data = await anilistQuery(query, { id }, DETAIL_TTL_MS);
  const raw = data?.Media;
  if (!raw) return null;

  const base = normalizeMediaList(raw);
  return {
    ...base,
    idMal: raw.idMal ?? null,
    description: raw.description ?? "",
    trending: raw.trending || 0,
    tags: raw.tags || [],
    hashtag: raw.hashtag || null,
    synonyms: raw.synonyms || [],
    siteUrl: raw.siteUrl || "",
    trailer: raw.trailer || null,
    characters: { edges: raw.characters?.edges || [] },
    staff: { edges: raw.staff?.edges || [] },
    relations: {
      edges: (raw.relations?.edges || []).filter(
        (e: any) => !e?.node?.type || e.node.type === "ANIME",
      ),
    },
    recommendations: { nodes: raw.recommendations?.nodes || [] },
    externalLinks: raw.externalLinks || [],
    streamingEpisodes: raw.streamingEpisodes || [],
    stats: raw.stats || { scoreDistribution: [], statusDistribution: [] },
  };
}

export async function fetchEpisodes(id: number): Promise<EpisodeResponse> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        status
        episodes
        nextAiringEpisode {
          episode
          airingAt
          timeUntilAiring
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
      }
    }
  `;

  const data = await anilistQuery(query, { id }, DETAIL_TTL_MS);
  const media = data?.Media;

  const airedCount = media?.nextAiringEpisode?.episode
    ? Math.max(1, media.nextAiringEpisode.episode - 1)
    : media?.episodes && media.episodes > 0
      ? media.episodes
      : media?.status === "NOT_YET_RELEASED"
        ? 0
        : 12;

  const streamingEps: Array<{ title?: string; thumbnail?: string }> =
    media?.streamingEpisodes || [];

  const titleByEpNum = new Map<number, { title: string; image?: string }>();
  streamingEps.forEach((se, idx) => {
    const match = se.title?.match(/Episode\s+(\d+)\s*[-–:]?\s*(.*)/i);
    const num = match ? parseInt(match[1], 10) : idx + 1;
    const cleanTitle = match?.[2]?.trim() || se.title || `Episode ${num}`;
    if (!titleByEpNum.has(num)) {
      titleByEpNum.set(num, { title: cleanTitle, image: se.thumbnail });
    }
  });

  const buildProviderList = (
    provider: string,
    category: "sub" | "dub",
  ): ProviderEpisodeItem[] =>
    Array.from({ length: airedCount }, (_, i) => {
      const epNum = i + 1;
      const meta = titleByEpNum.get(epNum);
      return {
        id: `watch/${provider}/${id}/${category}/${epNum}`,
        number: epNum,
        title: meta?.title || `Episode ${epNum}`,
        image: meta?.image,
        filler: false,
      };
    });

  return {
    mappings: {
      anilistId: id,
      malId: media?.idMal || undefined,
      nextAiringEpisode: media?.nextAiringEpisode || null,
    },
    providers: {
      megaplay: {
        episodes: {
          sub: buildProviderList("megaplay", "sub"),
          dub: [],
        },
      },
    },
  };
}

export async function fetchWatchSources(
  anilistId: number,
  episodeNumber: number,
): Promise<WatchSourcesResponse> {
  let intro = { start: 0, end: 0 };
  let outro = { start: 0, end: 0 };

  try {
    const epData = await fetchEpisodes(anilistId);
    const malId = epData.mappings.malId;
    if (malId && episodeNumber > 0) {
      const skipRes = await fetch(
        `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed&episodeLength=0`,
        { next: { revalidate: 3600 } },
      );
      if (skipRes.ok) {
        const skipJson = await skipRes.json();
        for (const item of skipJson?.results || []) {
          if (item.skipType === "op" && item.interval) {
            intro = {
              start: Math.floor(item.interval.startTime || 0),
              end: Math.floor(item.interval.endTime || 0),
            };
          } else if (item.skipType === "ed" && item.interval) {
            outro = {
              start: Math.floor(item.interval.startTime || 0),
              end: Math.floor(item.interval.endTime || 0),
            };
          }
        }
      }
    }
  } catch {
    // Ignore optional AniSkip lookup errors
  }

  return {
    streams: [],
    subtitles: [],
    intro,
    outro,
  };
}
