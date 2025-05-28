import { SEARCH_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeSearch, SearchAnimeParams } from "@/types/anime";
import { useQuery } from "react-query";

const searchAnime = async (params: SearchAnimeParams) => {
  const res = await api.get("/api/search", {
    params,
  });

  return res.data.data as IAnimeSearch;
};

export const useGetSearchAnimeResults = (params: SearchAnimeParams) => {
  return useQuery({
    queryFn: () => searchAnime(params),
    queryKey: [SEARCH_ANIME, { ...params }],
  });
};
