import { SEARCH_ANIME } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { ISuggestionAnime } from "@/types/anime";
import { SearchSuggestionsResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const searchAnime = async (q: string): Promise<ISuggestionAnime[]> => {
  if (!q) return [];
  const res = await api.get<SearchSuggestionsResponse>("/suggestions", {
    params: { query: q },
  });

  const suggestions = res.data.suggestions || [];
  return suggestions.map((item) => ({
    id: String(item.id),
    name: item.title || item.title_romaji || "Untitled",
    jname: item.title_romaji || "",
    poster: item.poster || "",
    episodes: {
      sub: item.episodes || 0,
      dub: item.episodes || 0,
    },
    type: item.format as any,
    moreInfo: [
      item.year ? String(item.year) : "",
      item.format || "",
      item.status || "",
    ].filter(Boolean),
  }));
};

export const useSearchAnime = (query: string) => {
  return useQuery({
    queryFn: () => searchAnime(query),
    queryKey: [SEARCH_ANIME, query],
    enabled: !!query,
  });
};

