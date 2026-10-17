import { api } from "@/lib/api";
import { MediaList } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export const GET_ANIME_RELATIONS = "GET_ANIME_RELATIONS";

const getAnimeRelations = async (anilistId: string): Promise<MediaList[]> => {
  const res = await api.get<{ results: MediaList[] } | MediaList[]>(
    `/anime/${anilistId}/relations`,
  );
  const data = res.data;
  const list = Array.isArray(data) ? data : data.results || [];
  return list.filter((item) => !item.isAdult);
};

export const useGetAnimeRelations = (anilistId: string) => {
  return useQuery({
    queryFn: () => getAnimeRelations(anilistId),
    queryKey: [GET_ANIME_RELATIONS, anilistId],
    enabled: !!anilistId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
