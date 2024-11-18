import { SEARCH_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnime } from "@/types/anime";
import { useQuery } from "react-query";

const searchAnime = async (q: string) => {
  if (q === "") {
    return;
  }
  const res = await api.get("/search", {
    params: {
      q: q,
    },
  });

  return res.data.data.animes as IAnime[];
};

export const useGetSearchAnimeResults = (query: string) => {
  return useQuery({
    queryFn: () => searchAnime(query),
    queryKey: [SEARCH_ANIME, query],
  });
};
