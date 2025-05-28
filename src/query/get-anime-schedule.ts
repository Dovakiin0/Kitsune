import { GET_ANIME_SCHEDULE } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeSchedule } from "@/types/anime-schedule";
import { useQuery } from "react-query";

const getAnimeSchedule = async (date: string) => {
  const queryParams = date ? `?date=${date}` : "";

  const res = await api.get("/api/schedule" + queryParams);
  return res.data.data as IAnimeSchedule;
};

export const useGetAnimeSchedule = (date: string) => {
  return useQuery({
    queryFn: () => getAnimeSchedule(date),
    queryKey: [GET_ANIME_SCHEDULE, date],
  });
};
