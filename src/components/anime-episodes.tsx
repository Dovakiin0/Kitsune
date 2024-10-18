"use client";

import { Episode } from "@/types/anime-details";
import React, { useState } from "react";
import EpisodeCard from "./common/episode-card";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

type Props = {
  episodes: Episode[];
  animeId:string
};

const AnimeEpisodes = (props: Props) => {
  const [episodes, setEpisodes] = useState<Episode[]>(props.episodes);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) {
      setEpisodes(props.episodes);
    } else {
      const filteredEpisodes = props.episodes.filter((episode) =>
        episode.title.toLowerCase().includes(query)
      );
      setEpisodes(filteredEpisodes);
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
      </div>
    </>
  );
};

export default AnimeEpisodes;

