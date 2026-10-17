import { get, set, isFresh, SHOW_IDENTITY_TTL } from "./smartcache.js";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const RELATION_FRAGMENT = `edges{relationType(version:2) node{id type episodes relations{edges{relationType(version:2) node{id type episodes relations{edges{relationType(version:2) node{id type episodes relations{edges{relationType(version:2) node{id type episodes}}}}}}}}}}}`;

export async function fetchHtml(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      ...headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

export function decodeEntities(s = "") {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function stripTags(html = "") {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

export function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

export function norm(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function diceCoeff(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;
  const bigrams = new Map();
  for (let i = 0; i < na.length - 1; i++) {
    const bg = na.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < nb.length - 1; i++) {
    const bg = nb.slice(i, i + 2);
    const count = bigrams.get(bg) ?? 0;
    if (count > 0) {
      hits++;
      bigrams.set(bg, count - 1);
    }
  }
  return (2 * hits) / (na.length + nb.length - 2);
}

const TITLE_STOP_WORDS = new Set([
  "a", "an", "and", "of", "the", "to", "in", "on", "for", "no", "wa",
  "season", "part", "stage", "cour", "chapter", "chapters", "episode",
  "episodes", "movie", "film", "tv", "ova", "ona", "special", "specials",
  "final", "finale", "arc",
]);

function titleText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function titleWords(value) {
  return new Set(titleText(value).split(/\s+/).filter((word) =>
    word.length > 1 && !TITLE_STOP_WORDS.has(word) && !/^\d+(?:st|nd|rd|th)?$/.test(word)
  ));
}

function markerValues(value) {
  const normalized = titleText(value);
  const text = normalized.replace(/\s+/g, "");
  const markers = new Map();
  for (const marker of ["season", "part", "stage", "cour"]) {
    const values = new Set();
    for (const match of text.matchAll(new RegExp(`${marker}(\\d+)`, "g"))) values.add(match[1]);
    for (const match of text.matchAll(new RegExp(`(\\d+)(?:st|nd|rd|th)${marker}`, "g"))) values.add(match[1]);
    for (const match of text.matchAll(new RegExp(`((?:\\d+(?:st|nd|rd|th))+?)${marker}`, "g"))) {
      for (const ordinal of match[1].matchAll(/(\d+)(?:st|nd|rd|th)/g)) values.add(ordinal[1]);
    }
    const words = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", first: "1", second: "2", third: "3", fourth: "4", fifth: "5" };
    for (const [word, number] of Object.entries(words)) {
      if (text.includes(`${marker}${word}`) || text.includes(`${word}${marker}`)) values.add(number);
    }
    if (values.size) markers.set(marker, values);
  }
  const finalMarkers = new Set();
  for (const match of text.matchAll(/final(season|chapters?|part|arc)/g)) {
    finalMarkers.add(match[1].startsWith("chapter") ? "chapters" : match[1]);
  }
  if (finalMarkers.size) markers.set("final", finalMarkers);
  if (/movie|film|gekijouban/.test(text)) markers.set("format", new Set(["movie"]));
  const typeMarker = normalized.match(/\b(ova|ona|special)\b/)?.[1];
  if (typeMarker) markers.set("format", new Set([typeMarker]));
  const ending = normalized.split(/\s+/).at(-1) || "";
  const number = ending.match(/^(\d{1,2})(?:st|nd|rd|th)?$/)?.[1]
    ?? text.match(/([a-z])(\d{1,2})$/)?.[2];
  const roman = { ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10" }[ending];
  const endingValue = number || roman;
  const isAlreadyMarked = endingValue && ["season", "part", "stage", "cour"].some((marker) => markers.get(marker)?.has(endingValue));
  if (endingValue && !isAlreadyMarked) markers.set("numbered", new Set([endingValue]));
  for (const match of text.matchAll(/(?:movie|film)(\d+)/g)) {
    if (!markers.has("numbered")) markers.set("numbered", new Set());
    markers.get("numbered").add(match[1]);
  }
  return markers;
}

export function titleMarkersConflict(targetTitles, candidateTitles, format) {
  const collect = (titles) => {
    const markers = new Map();
    for (const title of titles ?? []) {
      for (const [marker, values] of markerValues(title)) {
        if (!markers.has(marker)) markers.set(marker, new Set());
        for (const value of values) markers.get(marker).add(value);
      }
    }
    return markers;
  };
  const expected = collect(targetTitles);
  const found = collect(candidateTitles);
  const normalizedFormat = String(format ?? "").toLowerCase();
  const formatMarker = {
    movie: "movie",
    ova: "ova",
    ona: "ona",
    special: "special",
  }[normalizedFormat];
  if (formatMarker) expected.set("format", new Set([formatMarker]));

  for (const marker of ["season", "part", "stage", "cour", "numbered", "final", "format"]) {
    const expectedValues = expected.get(marker);
    const candidateValues = found.get(marker);
    if (expectedValues && !candidateValues && marker === "format") continue;
    if (expectedValues && (!candidateValues || ![...expectedValues].some((value) => candidateValues.has(value)))) return true;
    if (!expectedValues && candidateValues) return true;
  }
  return false;
}

function unicodeDice(a, b) {
  const left = titleText(a).replace(/\s+/g, "");
  const right = titleText(b).replace(/\s+/g, "");
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return 0;
  const bigrams = new Map();
  for (let index = 0; index < left.length - 1; index++) {
    const pair = left.slice(index, index + 2);
    bigrams.set(pair, (bigrams.get(pair) ?? 0) + 1);
  }
  let hits = 0;
  for (let index = 0; index < right.length - 1; index++) {
    const pair = right.slice(index, index + 2);
    const count = bigrams.get(pair) ?? 0;
    if (count) {
      hits++;
      bigrams.set(pair, count - 1);
    }
  }
  return (2 * hits) / (left.length + right.length - 2);
}

export function titleIdentityScore(titles, candidates) {
  const targetTitles = (titles ?? []).filter(Boolean);
  const candidateTitles = (candidates ?? []).filter(Boolean);
  const targetMarkers = new Map();
  for (const title of targetTitles.slice(0, 3)) {
    for (const [marker, values] of markerValues(title)) {
      if (!targetMarkers.has(marker)) targetMarkers.set(marker, new Set());
      for (const value of values) targetMarkers.get(marker).add(value);
    }
  }
  let best = 0;
  for (const title of targetTitles) {
    const queryWords = titleWords(title);
    for (const candidate of candidateTitles) {
      const candidateWords = titleWords(candidate);
      const coreTitle = [...queryWords].join(" ") || title;
      const coreCandidate = [...candidateWords].join(" ") || candidate;
      const lexical = unicodeDice(coreTitle, coreCandidate);
      if (!queryWords.size || !candidateWords.size) {
        if (lexical < 0.86) continue;
      }
      const candidateMarkers = markerValues(candidate);
      let markerConflict = false;
      let markerPenalty = 0;
      for (const [marker, queryValues] of targetMarkers) {
        const candidateValues = candidateMarkers.get(marker);
        if (candidateValues && ![...queryValues].some((value) => candidateValues.has(value))) {
          markerConflict = true;
          break;
        }
        if (!candidateValues && !(marker === "season" && candidateMarkers.has("final"))) {
          markerPenalty += ["season", "part", "stage", "cour"].includes(marker) ? 0.22 : 0.16;
        }
      }
      if (markerConflict) continue;
      for (const marker of candidateMarkers.keys()) {
        if (!targetMarkers.has(marker)) markerPenalty += ["season", "part", "stage", "cour"].includes(marker) ? 0.18 : 0.12;
      }
      markerPenalty = Math.min(0.48, markerPenalty);
      let shared = 0;
      for (const word of queryWords) if (candidateWords.has(word)) shared++;
      const coverage = queryWords.size && candidateWords.size
        ? Math.min(shared / queryWords.size, shared / candidateWords.size)
        : lexical;
      if (Math.min(queryWords.size, candidateWords.size) < 3) {
        if (lexical < 0.76) continue;
      } else if (coverage < 0.5) {
        continue;
      }
      best = Math.max(best, Math.max(0, lexical * 0.7 + coverage * 0.3 - markerPenalty));
    }
  }
  return best;
}

export function titleScore(query, candidate, slug) {
  const base = Math.max(diceCoeff(query, candidate), diceCoeff(query, slug.replace(/-/g, " ")));
  const queryFirstNum = norm(query).match(/\d+/)?.[0] ?? "";
  const slugFirstNum = slug.match(/\d+/)?.[0] ?? "";
  if (queryFirstNum && slugFirstNum && queryFirstNum !== slugFirstNum) return base * 0.65;
  if (queryFirstNum && !slugFirstNum) return base * 0.65;
  if (!queryFirstNum && slugFirstNum) {
    const n = parseInt(slugFirstNum);
    if (n > 1 && n < 1900) return base * (1 - 0.06 * (n - 1));
  }
  const isMovieQuery = /\b(movie|film|the movie)\b/i.test(query);
  const isMovieMatch = /\b(movie|film)\b/i.test(candidate) || /movie|film/.test(slug);
  if (isMovieQuery && !isMovieMatch) return base * 0.4;
  const qLen = norm(query).length;
  const sLen = norm(slug.replace(/-/g, " ")).length;
  return sLen > qLen * 1.6 + 4 ? base * 0.8 : base;
}

function buildSearchQueries(title) {
  const queries = new Set([title]);
  const words = title.trim().split(/\s+/);
  if (words.length > 4) queries.add(words.slice(0, 4).join(" "));
  if (words.length > 3) queries.add(words.slice(0, 3).join(" "));
  const stripped = title
    .replace(/\bseason\s*\d+\b/gi, "")
    .replace(/\bpart\s*\d+\b/gi, "")
    .replace(/\b\d+rd\b|\b\d+th\b|\b\d+st\b|\b\d+nd\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped && stripped !== title) queries.add(stripped);
  return [...queries].filter((q) => q.length >= 3);
}

export function buildTitleSearchQueries(titles, limit = 24) {
  const queries = new Map();
  const add = (value) => {
    const query = String(value ?? "").replace(/\s+/g, " ").trim();
    if (query.length >= 3) queries.set(query.toLowerCase(), query);
  };
  const uniqueTitles = [...new Set(titles.filter(Boolean).map((title) => String(title).trim()).filter(Boolean))].slice(0, 12);
  for (const title of uniqueTitles.slice(0, 8)) add(title);
  for (const title of uniqueTitles.slice(0, 4)) {
    add(String(title).replace(/[^\p{L}\p{N}]+/gu, " "));
    for (const query of buildSearchQueries(String(title))) add(query);
    const segments = String(title).split(/[:\u2013\u2014|]/).map((part) => part.trim());
    for (const segment of segments) if (segment.length >= 4) add(segment);
    const broad = String(title)
      .replace(/\b(?:season|part|cour|stage|chapter|episode)\s*(?:\d+|one|two|three|four|five|final)?\b/gi, " ")
      .replace(/\b(?:\d+)(?:st|nd|rd|th)\b/gi, " ")
      .replace(/\bthe\s+final\s+chapters?\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    add(broad);
  }
  for (const title of uniqueTitles.slice(8)) add(title);
  return [...queries.values()].slice(0, limit);
}

export async function findTopSlugs(titles, searchFn, n = 6) {
  const allCandidates = new Map();
  const searchQueries = buildTitleSearchQueries(titles, 20);
  await Promise.all(searchQueries.map(async (q) => {
    try {
      const results = await searchFn(q);
      for (const r of results) if (!allCandidates.has(r.slug)) allCandidates.set(r.slug, r.text);
    } catch {}
  }));
  const scored = [];
  for (const [slug, text] of allCandidates) {
    let best = 0;
    for (const title of titles) best = Math.max(best, titleScore(title, text, slug));
    const identity = titleIdentityScore(titles, [text, slug.replace(/-/g, " ")]);
    if (identity >= 0.6 && best >= 0.5) scored.push({ slug, title: text, score: best * 0.65 + identity * 0.35 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

async function anilistQuery(query, variables) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`AniList: ${json.errors[0].message}`);
  return json.data;
}

function computePrequelOffset(relations, depth = 0) {
  if (!relations || depth > 5) return 0;
  const prequelEdge = relations.edges?.find(
    (e) => e.relationType === "PREQUEL" && e.node.type === "ANIME" && (e.node.episodes ?? 0) >= 5
  );
  if (!prequelEdge) return 0;
  return (prequelEdge.node.episodes ?? 0) + computePrequelOffset(prequelEdge.node.relations, depth + 1);
}

export async function getPrequelOffset(anilistId) {
  const key = `np-offset:${anilistId}`;
  const entry = get(key);
  if (isFresh(entry)) return entry.data;
  const data = await anilistQuery(
    `query($id:Int){Media(id:$id,type:ANIME){relations{${RELATION_FRAGMENT}}}}`,
    { id: Number(anilistId) }
  );
  const offset = computePrequelOffset(data?.Media?.relations);
  set(key, offset, SHOW_IDENTITY_TTL);
  return offset;
}

export function buildTitles(media, anizip) {
  return [...new Set([
    media?.title?.english,
    media?.title?.romaji,
    media?.title?.native,
    anizip?.titles?.en,
    anizip?.titles?.["x-jat"],
    anizip?.titles?.ja,
    ...(media?.synonyms ?? []),
  ].filter(Boolean))];
}

export function expectedCount(media, anizip) {
  const counts = [
    media?.episodes,
    ...Object.keys(anizip?.episodes ?? {}).map(Number).filter(Number.isFinite),
  ].filter((n) => Number.isFinite(n) && n > 0);
  return counts.length ? Math.max(...counts) : null;
}

export function episodeMeta(n, ctx) {
  const az = ctx.anizip?.episodes?.[String(n)] ?? {};
  const runtime = az.runtime ?? az.length ?? null;
  return {
    title: az.title?.en ?? az.title?.["x-jat"] ?? null,
    duration: runtime ? runtime * 60 : null,
    filler: az.filler ?? false,
    uncensored: false,
    description: az.overview ?? az.summary ?? null,
    image: az.image ?? ctx.anizip?.images?.cover ?? null,
    airDate: az.airdate ?? az.aired ?? null,
  };
}

export function selectSeries(candidates, scrapeSeries, expected, status, offset, options = {}) {
  return Promise.all(candidates.map(async (candidate) => {
    const episodes = await scrapeSeries(candidate.slug);
    const max = Math.max(0, ...episodes.map((e) => e.number));
    const localHits = expected ? episodes.filter((e) => e.number >= 1 && e.number <= expected).length : episodes.length;
    const offsetHits = expected && offset
      ? episodes.filter((e) => e.number > offset && e.number <= offset + expected).length
      : 0;
    const mode = offsetHits > localHits ? "offset" : "local";
    const hits = Math.max(localHits, offsetHits);
    let countScore = 1;
    if (expected && expected >= 6) {
      const needed = status === "FINISHED" ? Math.ceil(expected * 0.9) : 1;
      countScore = hits >= needed ? 1 : hits / needed;
    }
    return { ...candidate, episodes, max, mode, score: candidate.score * 0.7 + countScore * 0.3 };
  })).then((results) => {
    const minScore = options.minScore ?? 0.65;
    const viable = results
      .filter((r) => r.episodes.length && r.score >= minScore)
      .sort((a, b) => b.score - a.score);
    if (!viable.length) return null;
    return viable[0];
  });
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
