import { SEARCH_ANIME } from "@/constants/query-keys"
import { api } from "@/lib/api"
import { IAnimeResponse } from "@/types/anime-api-response"
import { useQuery } from "react-query"

const searchAnime = async (q: string) => {
    const res = await api.get('/anime/search', {
        params: {
            q: q
        }
    })
    return res.data as IAnimeResponse
}

export const useSearchAnime = (query: string) => {
    return useQuery({
        queryFn: () => searchAnime(query),
        queryKey: [SEARCH_ANIME, query]
    })
}