import { GET_ALL_EPISODES } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { Episode, IEpisodes } from "@/types/episodes";
import { EpisodeResponse, NextAiringEpisode } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export interface IEpisodesData extends IEpisodes {
  rawResponse?: EpisodeResponse;
  availableProviders?: string[];
  nextAiringEpisode?: NextAiringEpisode | null;
}

const fetchAniListEpisodesFallback = async (
  animeId: string,
): Promise<IEpisodesData> => {
  try {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          episodes
          nextAiringEpisode {
            episode
          }
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { id: parseInt(animeId, 10) || 0 },
      }),
    });

    const json = await res.json();
    const media = json?.data?.Media;
    const totalEpCount = media?.nextAiringEpisode?.episode
      ? media.nextAiringEpisode.episode - 1
      : media?.episodes || 12;

    const episodes: Episode[] = Array.from(
      { length: totalEpCount > 0 ? totalEpCount : 12 },
      (_, i) => {
        const epNum = i + 1;
        return {
          title: `Episode ${epNum}`,
          episodeId: `${epNum}`,
          number: epNum,
          isFiller: false,
          hasSub: true,
          hasDub: false,
        };
      },
    );

    return {
      totalEpisodes: episodes.length,
      episodes,
      availableProviders: [],
    };
  } catch (err) {
    console.error("AniList fallback error:", err);
    const fallbackEpisodes: Episode[] = Array.from({ length: 12 }, (_, i) => ({
      title: `Episode ${i + 1}`,
      episodeId: `${i + 1}`,
      number: i + 1,
      isFiller: false,
      hasSub: true,
      hasDub: false,
    }));
    return {
      totalEpisodes: 12,
      episodes: fallbackEpisodes,
      availableProviders: [],
    };
  }
};

const getAllEpisodes = async (animeId: string): Promise<IEpisodesData> => {
  try {
    const res = await api.get<EpisodeResponse>(`/episodes/${animeId}`);
    const data = res.data;

    const providerNames = Object.keys(data.providers || {});

    const subEpNumbers = new Set<number>();
    const dubEpNumbers = new Set<number>();

    for (const pName of providerNames) {
      const pData = data.providers[pName]?.episodes;
      if (pData?.sub) {
        pData.sub.forEach((ep) => subEpNumbers.add(ep.number));
      }
      if (pData?.dub) {
        pData.dub.forEach((ep) => dubEpNumbers.add(ep.number));
      }
    }

    const allEpNumbersSet = new Set<number>([
      ...Array.from(subEpNumbers),
      ...Array.from(dubEpNumbers),
    ]);
    const allEpisodeNumbers = Array.from(allEpNumbersSet).sort((a, b) => a - b);

    const episodeList: Episode[] = allEpisodeNumbers.map((epNum) => {
      let epDetail: any = null;
      let fallbackId = "";

      for (const pName of providerNames) {
        const pData = data.providers[pName]?.episodes;
        const subMatch = pData?.sub?.find((e) => e.number === epNum);
        const dubMatch = pData?.dub?.find((e) => e.number === epNum);

        if (subMatch) {
          epDetail = subMatch;
          fallbackId = subMatch.id;
          break;
        }
        if (dubMatch && !epDetail) {
          epDetail = dubMatch;
          fallbackId = dubMatch.id;
        }
      }

      return {
        title: epDetail?.title || `Episode ${epNum}`,
        episodeId: fallbackId || `${epNum}`,
        number: epNum,
        isFiller: !!epDetail?.filler,
        hasSub: subEpNumbers.has(epNum),
        hasDub: dubEpNumbers.has(epNum),
      };
    });

    if (episodeList.length === 0) {
      return await fetchAniListEpisodesFallback(animeId);
    }

    return {
      totalEpisodes: episodeList.length,
      episodes: episodeList,
      rawResponse: data,
      availableProviders: providerNames,
      nextAiringEpisode: data.mappings?.nextAiringEpisode || null,
    };
  } catch (err) {
    console.warn(
      `Upstream /episodes API failed for animeId ${animeId}. Using AniList fallback:`,
      err,
    );
    return await fetchAniListEpisodesFallback(animeId);
  }
};

export const useGetAllEpisodes = (animeId: string) => {
  return useQuery({
    queryFn: () => getAllEpisodes(animeId),
    queryKey: [GET_ALL_EPISODES, animeId],
    enabled: !!animeId,
  });
};
