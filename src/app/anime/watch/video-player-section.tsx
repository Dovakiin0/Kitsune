"use client";

import KitsunePlayer from "@/components/kitsune-player";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useAnimeStore } from "@/store/anime-store";
import { IEpisodes } from "@/types/episodes";
import React from "react";

const VideoPlayerSection = () => {
  const { selectedEpisode, anime } = useAnimeStore();
  const { data: episodeData, isLoading } = useGetEpisodeData(selectedEpisode);

  if (isLoading)
    return (
      <div className="h-[28vh] md:h-full w-full animate-pulse bg-slate-700 rounded-md"></div>
    );

  return (
    <>
      <KitsunePlayer
        key={episodeData?.sources[0].url}
        episodeInfo={episodeData as IEpisodes}
        animeInfo={{ title: anime.title.english, image: anime.image }}
      />
    </>
  );
};

export default VideoPlayerSection;

