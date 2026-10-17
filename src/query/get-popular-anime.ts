import { api } from "@/lib/api";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export const GET_POPULAR_ANIME = "GET_POPULAR_ANIME";

const getPopularAnime = async (
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<MediaList>> => {
  const res = await api.get<PaginatedResponse<MediaList>>("/popular", {
    params: { page, per_page: perPage },
  });
  const data = res.data;
  return {
    ...data,
    results: (data.results || []).filter((item) => !item.isAdult),
  };
};

export const useGetPopularAnime = (page = 1, perPage = 20) => {
  return useQuery({
    queryFn: () => getPopularAnime(page, perPage),
    queryKey: [GET_POPULAR_ANIME, page, perPage],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
