import { ANIME_URI } from "@/utils/constants";

export default function useAnime() {
  let API = {
    recent: ANIME_URI + "/recent-episodes",
    popular: ANIME_URI + "/top-airing",
    info: ANIME_URI + "/info",
  };

  async function getRecent() {
    const data = await fetch(API.recent);
    return data.json();
  }

  async function getPopular() {
    const data = await fetch(API.popular);
    return data.json();
  }

  return { getRecent, getPopular };
}
