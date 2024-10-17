import { GET_POPULAR_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api"
import { IAnimeResponse } from "@/types/anime-api-response";
import { useQuery } from "react-query";

const getPopularAnime = async () => {
    const res = await api.get('/anime/popular');
    return res.data as IAnimeResponse
}

export const useGetPopularAnime = () => {
    return useQuery({
        queryFn: getPopularAnime,
        queryKey: [GET_POPULAR_ANIME],
        refetchOnWindowFocus: false
    })
}