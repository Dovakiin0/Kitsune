"use client";

import KitsunePlayer from "@/components/kitsune-player";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useAnimeStore } from "@/store/anime-store";
import { IEpisodes } from "@/types/episodes";
import { IWatchedAnime } from "@/types/watched-anime";
import React, { useEffect, useState } from "react";

const VideoPlayerSection = () => {
  const { selectedEpisode, anime } = useAnimeStore();
  const { data: episodeData, isLoading } = useGetEpisodeData(selectedEpisode);

  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    JSON.parse(localStorage.getItem("watched") as string) || []
  );

  useEffect(() => {
    if (episodeData) {
      const existingAnime = watchedDetails.find(
        (watchedAnime) => watchedAnime.anime === anime.id
      );

      if (!existingAnime) {
        // Add new anime entry if it doesn't exist
        const updatedWatchedDetails = [
          ...watchedDetails,
          { anime: anime.id, episodes: [selectedEpisode] },
        ];
        localStorage.setItem("watched", JSON.stringify(updatedWatchedDetails));
        setWatchedDetails(updatedWatchedDetails);
      } else {
        // Update the existing anime entry
        const episodeAlreadyWatched =
          existingAnime.episodes.includes(selectedEpisode);

        if (!episodeAlreadyWatched) {
          // Add the new episode to the list
          const updatedWatchedDetails = watchedDetails.map((watchedAnime) =>
            watchedAnime.anime === anime.id
              ? {
                  ...watchedAnime,
                  episodes: [...watchedAnime.episodes, selectedEpisode],
                }
              : watchedAnime
          );

          localStorage.setItem(
            "watched",
            JSON.stringify(updatedWatchedDetails)
          );
          setWatchedDetails(updatedWatchedDetails);
        }
      }
    }
    //eslint-disable-next-line
  }, [episodeData, selectedEpisode]);

  if (isLoading)
    return (
      <div className="h-[28vh] md:h-[80vh] w-full animate-pulse bg-slate-700 rounded-md"></div>
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

