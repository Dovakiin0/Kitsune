"use client";

import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

import EpisodeCard from "./common/episode-card";

import React, { useEffect, useState } from "react";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import { Episode } from "@/types/episodes";

type Props = {
  animeId: string;
};

const AnimeEpisodes = (props: Props) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  const { data, isLoading } = useGetAllEpisodes(props.animeId);

  useEffect(() => {
    if (data) {
      setEpisodes(data.episodes);
    }
  }, [data]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) {
      setEpisodes(data?.episodes as Episode[]);
    } else {
      const filteredEpisodes = data?.episodes.filter((episode) => {
        return (
          episode.title.toLowerCase().includes(query) ||
          query.includes(episode.number.toString()) ||
          "episode".includes(query.trim())
        );
      });
      setEpisodes(filteredEpisodes as Episode[]);
    }
  };

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <h3 className="text-xl font-semibold">Episodes</h3>
        <div className="relative max-w-[21.875rem] ">
          <Search className="absolute inset-y-0 left-2 m-auto h-4 w-4" />
          <Input
            placeholder="Search for episode..."
            className=" w-full pl-8 text-white border-white"
            onChange={handleSearch}
          />
        </div>
      </div>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {episodes.map((episode, idx) => {
          return (
            <EpisodeCard
              episode={episode}
              key={idx}
              className="self-center justify-self-center"
              animeId={props.animeId}
            />
          );
        })}
        {!episodes.length && !isLoading && (
          <div className="lg:col-span-5 col-span-2 sm:col-span-3 md:col-span-4 xl:col-span-6 2xl:col-span-7 flex items-center justify-center py-10 bg-slate-900 rounded-md">
            No Episodes
          </div>
        )}

        {isLoading &&
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((_, idx) => {
            return (
              <div
                key={idx}
                className={cn([
                  "h-[6.25rem] rounded-lg cursor-pointer w-full flex items-center justify-center animate-pulse bg-slate-800",
                  "self-center justify-self-center",
                ])}
              ></div>
            );
          })}
      </div>
    </>
  );
};

export default AnimeEpisodes;
