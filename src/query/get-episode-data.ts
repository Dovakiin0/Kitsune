import { GET_EPISODE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IEpisodeSource } from "@/types/episodes";
import { WatchSourcesResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const getEpisodeData = async (
  episodeId: string,
): Promise<IEpisodeSource> => {
  const endpoint = episodeId.startsWith("/") ? episodeId : `/${episodeId}`;
  const res = await api.get<WatchSourcesResponse>(endpoint);
  const data = res.data;

  const parts = episodeId.split("/");
  const anilistId = Number(parts[2] || parts[3]) || 0;

  return {
    headers: { Referer: "" },
    subtitles: (data.subtitles || []).map((sub) => ({
      lang: sub.label,
      url: sub.file,
    })),
    intro: data.intro || { start: 0, end: 0 },
    outro: data.outro || { start: 0, end: 0 },
    sources: (data.streams || []).map((s) => ({
      url: s.url,
      type: s.type,
    })),
    anilistID: anilistId,
    malID: 0,
  };
};

export const useGetEpisodeData = (episodeId: string, enabled: boolean = true) => {
  return useQuery({
    queryFn: () => getEpisodeData(episodeId),
    queryKey: [GET_EPISODE_DATA, episodeId],
    refetchOnWindowFocus: false,
    enabled: !!episodeId && enabled,
  });
};

