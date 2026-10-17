import { api } from "@/lib/api";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export const GET_UPCOMING_ANIME = "GET_UPCOMING_ANIME";

const getUpcomingAnime = async (
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<MediaList>> => {
  const res = await api.get<PaginatedResponse<MediaList>>("/upcoming", {
    params: { page, per_page: perPage },
  });
  const data = res.data;
  return {
    ...data,
    results: (data.results || []).filter((item) => !item.isAdult),
  };
};

export const useGetUpcomingAnime = (page = 1, perPage = 20) => {
  return useQuery({
    queryFn: () => getUpcomingAnime(page, perPage),
    queryKey: [GET_UPCOMING_ANIME, page, perPage],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
