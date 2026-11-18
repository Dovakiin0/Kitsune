import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Stub Next.js `@/lib/redis` alias so provider modules run directly under `node --test`.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/redis") {
      return {
        shortCircuit: true,
        url: "data:text/javascript,export const redisGet=async()=>null;export const redisSet=async()=>{};export const redisDel=async()=>{};export const redisKeys=async()=>[];export const isRedisConfigured=()=>false;",
      };
    }
    return nextResolve(specifier, context);
  },
});

const { default: providersApp } = await import("../src/lib/providers/index.js");

const SELECTIVE_ANIME = [
  { id: 212888, name: "Overgeared", format: "ONA", minEpisodes: 8 },
  { id: 151807, name: "Solo Leveling", format: "TV", minEpisodes: 12 },
  { id: 1535, name: "Death Note", format: "TV", minEpisodes: 37 },
  { id: 199, name: "Spirited Away", format: "MOVIE", minEpisodes: 1 },
];

const PROVIDERS = [
  { name: "mkissa" },
  { name: "reanime" },
  { name: "anikoto" },
  { name: "animegg" },
  {
    name: "animenosub",
    // Animenosub primarily carries recent seasonal releases (2024+).
    skipAnimeIds: new Set([1535, 199]),
  },
  { name: "anizone" },
  { name: "aniwaves" },
  { name: "kaa" },
  {
    name: "animeonsen",
    // AnimeOnsen does not carry Spirited Away (AniList 199) in its catalog.
    skipAnimeIds: new Set([199]),
  },
  { name: "anipm" },
  {
    name: "senshi",
    upstreamBroken: "senshi.to currently returns Cloudflare HTTP 523",
  },
  {
    name: "animedunya",
    upstreamBroken: "anime-dunya.com currently returns Cloudflare HTTP 403",
  },
];

const providerFilter = process.env.PROVIDERS
  ? new Set(process.env.PROVIDERS.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))
  : null;
const animeFilter = process.env.ANIME
  ? new Set(process.env.ANIME.split(",").map((s) => Number(s.trim())).filter(Number.isFinite))
  : null;
const includeBroken = process.env.INCLUDE_BROKEN === "1";
const testWatch = process.env.TEST_WATCH === "1";

function extractWatchUrls(payload) {
  const urls = [];
  for (const item of payload?.streams ?? []) {
    if (item?.url) urls.push(item.url);
  }
  for (const item of payload?.sources ?? []) {
    const url = item?.extractedUrl || item?.url;
    if (url) urls.push(url);
  }
  return urls;
}

const activeAnime = SELECTIVE_ANIME.filter((a) => !animeFilter || animeFilter.has(a.id));
const activeProviders = PROVIDERS.filter((p) => !providerFilter || providerFilter.has(p.name));

for (const anime of activeAnime) {
  test(`Provider suite: ${anime.name} (AniList ${anime.id}, ${anime.format})`, async (t) => {
    for (const provider of activeProviders) {
      if (provider.upstreamBroken && !includeBroken) {
        await t.test(`${provider.name} [skipped: ${provider.upstreamBroken}]`, { skip: provider.upstreamBroken }, () => {});
        continue;
      }
      if (provider.skipAnimeIds?.has(anime.id) && !providerFilter?.has(provider.name)) {
        await t.test(`${provider.name} [skipped: catalog does not cover older title]`, { skip: "catalog scope" }, () => {});
        continue;
      }

      await t.test(`${provider.name} episodes${testWatch ? " + watch" : ""}`, async () => {
        const epRes = await providersApp.fetch(
          new Request(`http://localhost/episodes/${provider.name}/${anime.id}?map=false`),
        );
        assert.equal(epRes.status, 200, `${provider.name} /episodes HTTP ${epRes.status}`);

        const epJson = await epRes.json();
        const providerError = epJson[provider.name]?.error;
        assert.ok(!providerError, `${provider.name} error: ${providerError}`);

        const entry = epJson.providers?.[provider.name];
        assert.ok(entry?.episodes, `${provider.name} missing episodes payload`);

        const sub = Array.isArray(entry.episodes.sub) ? entry.episodes.sub : [];
        const dub = Array.isArray(entry.episodes.dub) ? entry.episodes.dub : [];
        const primary = sub.length ? sub : dub;

        assert.ok(
          primary.length >= anime.minEpisodes,
          `${provider.name} expected >= ${anime.minEpisodes} episodes for ${anime.name}, got sub=${sub.length}, dub=${dub.length}`,
        );
        assert.ok(primary[0]?.id, `${provider.name} first episode missing watch id`);

        if (testWatch) {
          const watchRes = await providersApp.fetch(
            new Request(`http://localhost/${primary[0].id}`),
          );
          assert.equal(watchRes.status, 200, `${provider.name} /watch HTTP ${watchRes.status}`);
          const watchJson = await watchRes.json();
          const urls = extractWatchUrls(watchJson);
          assert.ok(urls.length > 0, `${provider.name} returned no stream/source URLs`);
        }
      });
    }
  });
}
