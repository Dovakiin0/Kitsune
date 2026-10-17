const __name = (fn, _) => fn;
import { getMedia } from './anilist.js';

var ARM2 = "https://arm.haglund.dev/api/v2/ids";
var UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
function hashFranchiseId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}
__name(hashFranchiseId, "hashFranchiseId");
async function fetchARM(anilistId) {
  const res = await fetch(`${ARM2}?source=anilist&id=${anilistId}`, {
    headers: { "User-Agent": UA2, "Accept": "application/json" }
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}
__name(fetchARM, "fetchARM");
async function fetchAniListRelations(anilistId) {
  const q = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id synonyms
      relations {
        edges {
          relationType(version: 2)
          node {
            id type format title { romaji english native }
            relations {
              edges {
                relationType(version: 2)
                node { id type format title { romaji english native } }
              }
            }
          }
        }
      }
    }
  }`;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: q, variables: { id: Number(anilistId) } })
    });
    if (!res.ok) return null;
    const json6 = await res.json();
    return json6.data?.Media ?? null;
  } catch {
    return null;
  }
}
__name(fetchAniListRelations, "fetchAniListRelations");
async function mapAnimeIds(anilistId) {
  const [arm, media, alRelations] = await Promise.all([
    fetchARM(anilistId),
    getMedia(anilistId).catch(() => null),
    fetchAniListRelations(anilistId)
  ]);
  const malId = arm?.myanimelist ?? null;
  const format = media?.format ?? null;
  const year = media?.seasonYear ?? null;
  const titleEn = media?.title?.english || null;
  const titleRom = media?.title?.romaji || null;
  const synonyms = [...(media?.synonyms ?? [])];
  if (alRelations?.synonyms) {
    for (const s of alRelations.synonyms) {
      if (!synonyms.includes(s)) synonyms.push(s);
    }
  }
  const franchiseMap = new Map();
  if (alRelations?.relations?.edges) {
    for (const e1 of alRelations.relations.edges) {
      if (!franchiseMap.has(e1.node.id)) {
        franchiseMap.set(e1.node.id, {
          relation: e1.relationType,
          anilistId: e1.node.id,
          title: e1.node.title.romaji || e1.node.title.english,
          type: e1.node.type,
          format: e1.node.format
        });
      }
      if (e1.node.relations?.edges) {
        for (const e2 of e1.node.relations.edges) {
          if (e2.node.id === Number(anilistId)) continue;
          if (!franchiseMap.has(e2.node.id)) {
            franchiseMap.set(e2.node.id, {
              relation: e2.relationType,
              anilistId: e2.node.id,
              title: e2.node.title.romaji || e2.node.title.english,
              type: e2.node.type,
              format: e2.node.format
            });
          }
        }
      }
    }
  }
  const thetvdbId = arm?.thetvdb ?? null;
  const themoviedbId = arm?.themoviedb ?? null;
  const imdbId = arm?.imdb ?? null;
  return {
    mappings: {
      id: Number(anilistId),
      title: titleEn || titleRom,
      type: arm?.media ?? null,
      format,
      episodes: media?.episodes ?? null,
      malId,
      aniId: Number(anilistId),
      anidbId: arm?.anidb ?? null,
      animePlanetId: arm?.["anime-planet"] ?? null,
      kitsuId: arm?.kitsu ?? null,
      animeCountdownId: arm?.animecountdown ?? null,
      anisearchId: arm?.anisearch ?? null,
      notifyMoeId: null,
      simklId: arm?.simkl ?? null,
      imdbId,
      themoviedbId,
      thetvdbId,
      livechartId: arm?.livechart ?? null,
      annId: arm?.animenewsnetwork ?? null,
      animescheduleId: null,
      animethemesId: null,
      animefillerlistId: null,
      franchiseAnchor: thetvdbId ? `tvdb:${thetvdbId}` : null,
      franchiseId: thetvdbId ? hashFranchiseId(`tvdb:${thetvdbId}`) : null,
      defaultTvdbSeason: arm?.["thetvdb-season"] != null ? String(arm["thetvdb-season"]) : null,
      tmdbSeason: arm?.["themoviedb-season"] != null ? String(arm["themoviedb-season"]) : null,
      episodeOffset: null,
      tmdbOffset: null,
      malIds: null,
      aniskip: null,
      animefillerlist: null,
      synonyms,
      franchise: Array.from(franchiseMap.values())
    }
  };
}
__name(mapAnimeIds, "mapAnimeIds");
export { mapAnimeIds };
