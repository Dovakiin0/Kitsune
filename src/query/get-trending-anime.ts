import { GET_TRENDING_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api"
import { IAnimeResponse } from "@/types/anime-api-response";
import { useQuery } from "react-query";

const getTrendingAnime = async () => {
    const res = await api.get('/anime/trending');
    return res.data as IAnimeResponse;
}

export const useGetTrendingAnime = () => {
    return useQuery({
        queryFn: getTrendingAnime,
        queryKey: GET_TRENDING_ANIME,
        refetchOnWindowFocus: false
    })
}