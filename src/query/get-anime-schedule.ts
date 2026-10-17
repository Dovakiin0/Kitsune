import { GET_ANIME_SCHEDULE } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeSchedule } from "@/types/anime-schedule";
import { ScheduleItem, PaginatedResponse } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const getAnimeSchedule = async (date?: string): Promise<IAnimeSchedule> => {
  const res = await api.get<PaginatedResponse<ScheduleItem>>("/schedule", {
    params: date ? { date } : undefined,
  });
  const items = res.data.results || [];

  const scheduledAnimes = items.map((item) => {
    const hours = Math.floor((item.timeUntilAiring || 0) / 3600);
    const minutes = Math.floor(((item.timeUntilAiring || 0) % 3600) / 60);
    const timeString = item.timeUntilAiring > 0 ? `in ${hours}h ${minutes}m` : "Airing soon";

    return {
      id: String(item.id),
      name: item.title?.english || item.title?.romaji || item.title?.native || "Untitled",
      jname: item.title?.native || item.title?.romaji || "",
      poster: item.coverImage?.extraLarge || item.coverImage?.large || "",
      time: timeString,
      airingTimestamp: item.airingAt ? item.airingAt * 1000 : Date.now(),
      secondsUntilAiring: item.timeUntilAiring || 0,
      episode: item.next_episode || 1,
    };
  });

  return { scheduledAnimes };
};

export const useGetAnimeSchedule = (date?: string) => {
  return useQuery({
    queryFn: () => getAnimeSchedule(date),
    queryKey: [GET_ANIME_SCHEDULE, date],
  });
};


