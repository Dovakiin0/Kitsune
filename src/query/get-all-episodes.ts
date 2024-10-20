import { GET_ALL_EPISODES } from "@/constants/query-keys";
import { api } from "@/lib/api"
import { Episode } from "@/types/anime-details";
import { useQuery } from "react-query";

const getAllEpisodes = async (animeId: string) => {
    const res = await api.get(`/anime/${animeId}/episodes`);
    return res.data as Episode[];
}

export const useGetAllEpisodes = (animeId: string) => {
    return useQuery({
        queryFn: () => getAllEpisodes(animeId),
        queryKey: [GET_ALL_EPISODES, animeId]
    })
}