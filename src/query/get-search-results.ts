import { SEARCH_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeSearch, SearchAnimeParams } from "@/types/anime";
import { MediaList, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const searchAnime = async (params: SearchAnimeParams): Promise<IAnimeSearch> => {
  const requestParams: Record<string, any> = {
    page: params.page || 1,
    per_page: 20,
    genre: params.genres || undefined,
    season: params.season ? params.season.toUpperCase() : undefined,
    format: params.type ? params.type.toUpperCase() : undefined,
    status: params.status ? params.status.toUpperCase() : undefined,
    sort: params.sort ? params.sort.toUpperCase() : undefined,
  };

  const cleanQuery = params.q ? params.q.replace(/^"+|"+$/g, "").trim() : "";

  // If search term is present without specific filter override, use /search or pass to filter query
  const endpoint = cleanQuery && !params.genres && !params.season && !params.type && !params.status
    ? "/search"
    : "/filter";

  if (endpoint === "/search") {
    requestParams.query = cleanQuery;
  }

  const res = await api.get<PaginatedResponse<MediaList>>(endpoint, {
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

