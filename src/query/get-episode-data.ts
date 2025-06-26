import { GET_EPISODE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IEpisodeSource } from "@/types/episodes";
import { useQuery } from "react-query";

const getEpisodeData = async (
  episodeId: string,
  server: string | undefined,
  subOrDub: string,
) => {
  const res = await api.get("/api/episode/sources", {
    params: {
      animeEpisodeId: decodeURIComponent(episodeId),
      server: server,
      category: subOrDub,
    },
  });
  return res.data.data as IEpisodeSource;
};

export const useGetEpisodeData = (
  episodeId: string,
  server: string | undefined,
  subOrDub: string = "sub",
) => {
  return useQuery({
    queryFn: () => getEpisodeData(episodeId, server, subOrDub),
    queryKey: [GET_EPISODE_DATA, episodeId, server, subOrDub],
    refetchOnWindowFocus: false,
    enabled: server !== "",
  });
};
