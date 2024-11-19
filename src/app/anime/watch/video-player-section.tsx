"use client";

import React, { useEffect, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";

import { IWatchedAnime } from "@/types/watched-anime";
import KitsunePlayer from "@/components/kitsune-player";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useGetEpisodeServers } from "@/query/get-episode-servers";

const VideoPlayerSection = () => {
  const { selectedEpisode, anime } = useAnimeStore();

  console.log("selected", selectedEpisode);

  const { data: serversData } = useGetEpisodeServers(selectedEpisode);

  const { data: episodeData, isLoading } = useGetEpisodeData(
    selectedEpisode,
    serversData?.sub[0]?.serverName as string,
  );

  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    JSON.parse(localStorage.getItem("watched") as string) || [],
  );

  useEffect(() => {
    if (episodeData) {
      const existingAnime = watchedDetails.find(
        (watchedAnime) => watchedAnime.anime.id === anime.anime.info.id,
      );

      if (!existingAnime) {
        // Add new anime entry if it doesn't exist
        const updatedWatchedDetails = [
          ...watchedDetails,
          {
            anime: {
              id: anime.anime.info.id,
              title: anime.anime.info.name,
              poster: anime.anime.info.poster,
            },
            episodes: [selectedEpisode],
          },
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
            watchedAnime.anime.id === anime.anime.info.id
              ? {
                  ...watchedAnime,
                  episodes: [...watchedAnime.episodes, selectedEpisode],
                }
              : watchedAnime,
          );

          localStorage.setItem(
            "watched",
            JSON.stringify(updatedWatchedDetails),
          );
          setWatchedDetails(updatedWatchedDetails);
        }
      }
    }
    //eslint-disable-next-line
  }, [episodeData, selectedEpisode]);

  if (isLoading || !episodeData)
    return (
      <div className="h-[28vh] md:h-[80vh] w-full animate-pulse bg-slate-700 rounded-md"></div>
    );

  return (
    <>
      <KitsunePlayer
        key={episodeData?.sources[0].url}
        episodeInfo={episodeData!}
        animeInfo={{
          title: anime.anime.info.name,
          image: anime.anime.info.poster,
        }}
      />
    </>
  );
};

export default VideoPlayerSection;
