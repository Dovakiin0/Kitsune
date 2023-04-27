import { NEWS_URI } from "@/utils/constants";

export default function useNews() {
  const API = {
    recent: NEWS_URI + "/recent-feeds",
    info: NEWS_URI + "/info",
  };

  async function getRecentNews(topic: string = "anime") {
    const data = await fetch(API.recent + "?topic=" + topic);
    return data.json();
  }

  async function getNewsInfo(id: string) {
    const data = await fetch(API.info + "?id=" + id);
    return data.json();
  }

  return { getRecentNews, getNewsInfo };
}
