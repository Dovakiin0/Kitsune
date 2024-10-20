import { api } from "@/lib/api"
import { useQuery } from "react-query";
import { GET_RECENT_ANIME } from "@/constants/query-keys";
import { IAnimeResponse } from "@/types/anime-api-response";

const getRecentAnime = async () => {
    const res = await api.get('/anime/recent', {
        params: { limit: 28 }
    });
    return res.data as IAnimeResponse;
}

export const useGetRecentAnime = () => {
    return useQuery({
        queryFn: getRecentAnime,
        queryKey: [GET_RECENT_ANIME],
        refetchOnWindowFocus: false
    })
}