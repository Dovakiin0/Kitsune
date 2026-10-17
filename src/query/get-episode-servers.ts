import { GET_EPISODE_SERVERS } from "@/constants/query-keys";
import { IEpisodeServers } from "@/types/episodes";
import { useQuery } from "@tanstack/react-query";

const getEpisodeServers = async (episodeId: string): Promise<IEpisodeServers> => {
  const parts = episodeId ? episodeId.split("/") : [];
  const currentProvider = parts[1] || "kiwi";

  return {
    episodeId: episodeId || "",
    episodeNo: parts[4] ? parts[4].replace(/.*?(\d+).*/, "$1") : "1",
    sub: [
      { serverId: 1, serverName: currentProvider },
      { serverId: 2, serverName: "arc" },
      { serverId: 3, serverName: "zoro" },
    ],
    dub: [
      { serverId: 1, serverName: currentProvider },
      { serverId: 2, serverName: "arc" },
    ],
    raw: [],
  };
};

export const useGetEpisodeServers = (episodeId: string) => {
  return useQuery({
    queryFn: () => getEpisodeServers(episodeId),
    queryKey: [GET_EPISODE_SERVERS, episodeId],
    enabled: !!episodeId,
    refetchOnWindowFocus: false,
  });
};

