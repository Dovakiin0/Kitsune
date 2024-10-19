import { GET_EPISODE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api"
import { IEpisodes } from "@/types/episodes"
import { useQuery } from "react-query";

const getEpisodeData = async (episodeId: string) => {
    const res = await api.get('/anime/episode/' + episodeId)
    return res.data as IEpisodes;
}

export const useGetEpisodeData = (episodeId: string) => {
    return useQuery({
        queryFn: () => getEpisodeData(episodeId),
        queryKey: [GET_EPISODE_DATA, episodeId],
        refetchOnWindowFocus: false
    })
}