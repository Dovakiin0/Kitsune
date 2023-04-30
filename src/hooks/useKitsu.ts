import { IKitsuAnime, IKitsuEpisodeCore } from "@/@types/KitsuAnime";
import { KITSU_URI } from "@/utils/constants";

export default function useKitsu() {
  const API = {
    info: KITSU_URI + "/anime",
  };

  async function getKitsuMapping(episodeId: string) {
    const res = await fetch(API.info + "?filter[slug]=" + episodeId);
    const infoData: { data: IKitsuAnime[] } = await res.json();
    if (infoData.data.length <= 0) return;
    return getEpisodesInfo(
      infoData.data[0].relationships.episodes.links.related + "?page[limit]=20"
    );
  }

  async function ggetKitsuMapping(episodeId: string, current: number = 1) {
    const res = await fetch(API.info + "?filter[slug]=" + episodeId);
    const infoData: { data: IKitsuAnime[] } = await res.json();

    let maxEpisode = 60;
    let curMin = current * maxEpisode - maxEpisode + 1;
    let curMax = current * maxEpisode;

    let eps: IKitsuEpisodeCore[] = [];

    if (infoData.data.length <= 0) return;
    let episode = await getEpisodesInfo(
      infoData.data[0].relationships.episodes.links.related + "?page[limit]=20"
    );

    eps.push(...episode.data);
    if (episode.meta.count < maxEpisode) return eps;
  }

  async function getEpisodesInfo(episodeUrl: string) {
    const res = await fetch(episodeUrl);
    return res.json();
  }

  return { getKitsuMapping };
}
