import kv from "@vercel/kv";
import { ANIME_URI } from "@/utils/constants";

export default function useAnime() {
  let API = {
    recent: ANIME_URI + "/recent",
    popular: ANIME_URI + "/popular",
    info: ANIME_URI + "/anime",
    episode: ANIME_URI + "/watch",
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

  async function getEpisode(id: string, serverName: string = "gogocdn") {
    let KV;
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      KV = await kv.get(id);
      if (KV !== null) {
        console.log("HIT");
        return KV;
      }
    }
    const data = await fetch(API.episode + "/" + id + "?server=" + serverName);
    let json = await data.json();

    console.log("MISS");
    if (KV) {
      await kv.set(id, JSON.stringify(json));
    }
    return json;
  }

  async function getSearch(query: string) {
    const data = await fetch(ANIME_URI + "/" + query);
    return data.json();
  }

  return {
    getRecent,
    getPopular,
    getInfo,
    getEpisode,
    getSearch,
  };
}
