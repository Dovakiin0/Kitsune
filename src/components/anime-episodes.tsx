"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import EpisodeCard from "./common/episode-card";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import { Episode } from "@/types/episodes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Props = {
  animeId: string;
};

const AnimeEpisodes = ({ animeId }: Props) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [ranges, setRanges] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>("");

  const { data, isLoading } = useGetAllEpisodes(animeId);

  useEffect(() => {
    if (data) {
      const episodes = data.episodes;
      setAllEpisodes(episodes);

      if (episodes.length > 50) {
        // Calculate ranges
        const rangesArray = [];
        for (let i = 0; i < episodes.length; i += 50) {
          const start = i + 1;
          const end = Math.min(i + 50, episodes.length);
          rangesArray.push(`${start}-${end}`);
        }
        setRanges(rangesArray);
        setSelectedRange(rangesArray[0]);

        // Filter the first range directly from episodes
        const filteredEpisodes = episodes.filter(
          (_, index) => index + 1 >= 1 && index + 1 <= 50,
        );
        setEpisodes(filteredEpisodes);
      } else {
        setEpisodes(episodes);
      }
    }
  }, [data]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);

    const [start, end] = range.split("-").map(Number);
    const filteredEpisodes = allEpisodes.filter(
      (_, index) => index + 1 >= start && index + 1 <= end,
    );
    setEpisodes(filteredEpisodes);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      // Reset episodes to the selected range
      const [start, end] = selectedRange.split("-").map(Number);
      const filteredEpisodes = allEpisodes.filter(
        (_, index) => index + 1 >= start && index + 1 <= end,
      );
      setEpisodes(filteredEpisodes);
    } else {
      const filteredEpisodes = episodes.filter((episode, index) => {
        return (
          (index + 1).toString().includes(query) ||
          episode.title.toLowerCase().includes(query) ||
          "episode".includes(query.trim())
        );
      });
      setEpisodes(filteredEpisodes);
    }
  };

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <h3 className="text-xl font-semibold">Episodes</h3>
        <div className="flex items-center gap-2">
          {ranges.length > 0 && (
            <Select onValueChange={handleRangeChange} value={selectedRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  className="text-white"
                  placeholder="Select Range"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ranges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <div className="relative max-w-[21.875rem] ">
            <Search className="absolute inset-y-0 left-2 m-auto h-4 w-4" />
            <Input
              placeholder="Search for episode..."
              className=" w-full pl-8 text-white border-white"
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-5 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9 w-full gap-5 content-center">
        {episodes.map((episode, idx) => (
          <EpisodeCard
            episode={episode}
            key={idx}
            className="self-center justify-self-center"
            animeId={animeId}
          />
        ))}
        {!episodes.length && !isLoading && (
          <div className="lg:col-span-5 col-span-2 sm:col-span-3 md:col-span-4 xl:col-span-6 2xl:col-span-7 flex items-center justify-center py-10 bg-slate-900 rounded-md">
            No Episodes
          </div>
        )}
        {isLoading &&
          Array.from({ length: 14 }).map((_, idx) => (
            <div
              key={idx}
              className={cn([
                "h-[6.25rem] rounded-lg cursor-pointer w-full flex items-center justify-center animate-pulse bg-slate-800",
                "self-center justify-self-center",
              ])}
            ></div>
          ))}
      </div>
    </>
  );
};

export default AnimeEpisodes;
