import Container from "./container";
import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useGetAnimeSchedule } from "@/query/get-anime-schedule";
import Button from "./common/custom-button";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/constants/routes";
import { Badge } from "./ui/badge";
import { Clock, Play } from "lucide-react";

function AnimeSchedule() {
  const currentDate = new Date();
  const baseDays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDayIndex = currentDate.getDay();
  const daysOfWeek = [
    ...baseDays.slice(currentDayIndex),
    ...baseDays.slice(0, currentDayIndex),
  ];
  const currentDay = daysOfWeek[0];
  const [currentSelectedTab, setCurrentSelectedTab] =
    React.useState<string>(currentDay);

  const defaultTab = currentDay;

  const selectedDate = useMemo(() => {
    const date = getDateForWeekday(currentSelectedTab);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [currentSelectedTab]);

  const { isLoading, data } = useGetAnimeSchedule(selectedDate);

  function getDateForWeekday(targetDay: string) {
    const offset = Math.max(0, daysOfWeek.indexOf(targetDay));
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + offset);
    return date;
  }

  return (
    <Container className="flex flex-col gap-6 py-10 items-start">
      <div className="flex flex-col gap-1">
        <h5 className="text-2xl md:text-3xl font-bold text-white">Estimated Schedule</h5>
        <p className="text-sm text-gray-400">Track upcoming episode releases for this week</p>
      </div>

      <Tabs
        orientation="vertical"
        defaultValue={defaultTab}
        onValueChange={(val) => setCurrentSelectedTab(val)}
        value={currentSelectedTab}
        className="w-full flex flex-col md:flex-row gap-6"
      >
        {/* Vertical Tabs List */}
        <TabsList className="flex flex-row md:flex-col justify-start items-stretch gap-2 w-full md:w-56 shrink-0 h-auto md:h-fit border-none overflow-x-auto no-scrollbar bg-secondary/30 p-2 rounded-xl border border-slate-800/80">
          {daysOfWeek.map((day) => {
            const dateObj = getDateForWeekday(day);
            const isToday = day === currentDay;

            return (
              <TabsTrigger
                key={day}
                value={day}
                className="shrink-0 flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all data-[state=active]:bg-[#e9376b] data-[state=active]:text-white hover:bg-slate-800/60"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm uppercase tracking-wider">
                    {day}
                  </span>
                  <span className="text-[11px] opacity-75">
                    {dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {isToday && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] ml-2">
                    Today
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Schedule Cards Content */}
        <div className="flex-1 w-full min-h-[300px]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            daysOfWeek.map((day) => (
              <TabsContent key={day} value={day} className="mt-0">
                {day === currentSelectedTab && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {data?.scheduledAnimes.map((anime, idx) => {
                      const timeFormatted = new Date(
                        anime.airingTimestamp,
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <div
                          key={`${anime.id}-${anime.episode}-${idx}`}
                          className="flex flex-row gap-3 p-3 bg-secondary/40 border border-slate-800/60 hover:border-slate-700 rounded-xl hover:bg-secondary/70 transition group relative overflow-hidden"
                        >
                          {/* Small Poster Thumbnail */}
                          {anime.poster ? (
                            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg relative bg-slate-800">
                              <Image
                                src={anime.poster}
                                alt={anime.name}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="h-24 w-16 shrink-0 bg-slate-800 rounded-lg flex items-center justify-center">
                              <Clock className="h-6 w-6 text-gray-500" />
                            </div>
                          )}

                          {/* Info Column */}
                          <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3 text-[#e9376b]" />
                                {timeFormatted}
                              </span>
                              <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                {anime.name}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-2">
                              <Badge className="bg-[#e9376b]/20 text-[#e9376b] border border-[#e9376b]/40 text-[10px] px-2 py-0.5">
                                Ep {anime.episode}
                              </Badge>
                              <Link href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-slate-800 hover:bg-[#e9376b] text-white px-2.5 rounded-lg flex items-center gap-1 transition"
                                >
                                  <Play className="h-3 w-3 fill-current" /> Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))
          )}
        </div>
      </Tabs>
    </Container>
  );
}

const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div
          key={idx}
          className="flex flex-row gap-3 p-3 bg-secondary/30 border border-slate-800/60 rounded-xl animate-pulse"
        >
          {/* Poster Skeleton */}
          <div className="h-24 w-16 shrink-0 bg-slate-800 rounded-lg"></div>

          {/* Lines Skeleton */}
          <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-16 bg-slate-800 rounded"></div>
              <div className="h-4 w-4/5 bg-slate-800 rounded"></div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="h-5 w-12 bg-slate-800 rounded-full"></div>
              <div className="h-7 w-16 bg-slate-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnimeSchedule;
