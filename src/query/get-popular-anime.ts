import { GET_POPULAR_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeResponse } from "@/types/anime-api-response";
import { IRequestParams } from "@/types/requests";
import { useQuery } from "react-query";

const getPopularAnime = async (queryParams: IRequestParams, pageParam = 1) => {
  const res = await api.get("/anime/popular", {
    params: { ...queryParams, page: pageParam }, // Include pageParam in query params
  });
  return res.data as IAnimeResponse;
};

export const useGetPopularAnime = (query: IRequestParams) => {
  return useQuery({
    queryFn: ({ pageParam = 1 }) => getPopularAnime(query, pageParam), // Pass pageParam to queryFn
    queryKey: [GET_POPULAR_ANIME, query],
  });
};
