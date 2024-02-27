import kv from "@vercel/kv";
import { BASE_URI } from "@/utils/constants";

export default function useAnime() {
  let API = {
    recent: BASE_URI + "/anime/recent",
    popular: BASE_URI + "/anime/popular",
    info: BASE_URI + "/anime/info",
    episode: BASE_URI + "/anime/zoro",
    search: BASE_URI + "/anime/search",
  };

  async function getRecent() {
    const data = await fetch(API.recent, {
      cache: "no-store",
    });
    const json = await data.json();
    return json;
  }

  async function getPopular() {
    const data = await fetch(API.popular);
    return data.json();
  }

  async function getInfo(id: string) {
    const data = await fetch(API.info + "/" + id, {
      next: { revalidate: 5 * 60 },
    });
    return data.json();
  }

  async function getEpisodeZoro(id: string) {
    let KV;
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      KV = await kv.get(id);
      if (KV !== null) {
        return KV;
      }
    }
    const data = await fetch(location.origin + "/api/anime/zoro" + id);
    let json = await data.json();

    if (KV) {
      await kv.set(id, JSON.stringify(json));
    }
    return json;
  }

  async function getEpisodeGogo(id: string) {
    let KV;
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      KV = await kv.get(id);
      if (KV !== null) {
        return KV;
      }
    }
    const data = await fetch(location.origin + "/api/anime/gogo/watch/" + id);
    let json = await data.json();

    if (KV) {
      await kv.set(id, JSON.stringify(json));
    }
    return json;
  }

  async function getSearch(query: string) {
    const data = await fetch(location.origin + "/api/anime/search/" + query);
    return data.json();
  }

  return {
    getRecent,
    getPopular,
    getInfo,
    getEpisodeZoro,
    getEpisodeGogo,
    getSearch,
  };
}
