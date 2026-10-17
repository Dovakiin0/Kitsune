import { SEARCH_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeSearch, SearchAnimeParams } from "@/types/anime";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const searchAnime = async (params: SearchAnimeParams): Promise<IAnimeSearch> => {
  const cleanQuery = params.q ? params.q.replace(/^"+|"+$/g, "").trim() : "";

  const requestParams: Record<string, any> = {
    page: params.page || 1,
    per_page: 20,
    genre: params.genres || undefined,
    season: params.season || undefined,
    format: params.type || undefined,
    status: params.status || undefined,
    sort: params.sort || undefined,
    query: cleanQuery || undefined,
  };

  const res = await api.get<PaginatedResponse<MediaList>>("/filter", {
    params: requestParams,
  });

  const data = res.data;
  const results = (data.results || []).filter((item) => !item.isAdult);

  const calculatedPages = Math.ceil((data.total || 0) / (data.perPage || 20));
  const totalPages = Math.min(calculatedPages, 20);

  return {
    animes: results.map((m) => ({
      id: String(m.id),
      name: m.title?.english || m.title?.romaji || m.title?.native || "Untitled",
      jname: m.title?.native || m.title?.romaji || "",
      poster: m.coverImage?.extraLarge || m.coverImage?.large || "",
      episodes: {
        sub: m.episodes || 0,
        dub: m.episodes || 0,
      },
      type: m.format as any,
    })),
    totalPages: totalPages > 0 ? totalPages : 1,
    hasNextPage: data.hasNextPage,
    currentPage: data.page,
  };
};

export const useGetSearchAnimeResults = (params: SearchAnimeParams) => {
  return useQuery({
    queryFn: () => searchAnime(params),
    queryKey: [SEARCH_ANIME, { ...params }],
  });
};

