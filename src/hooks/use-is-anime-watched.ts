import { useState, useEffect } from "react";
import { IWatchedAnime } from "@/types/watched-anime";

export const useHasAnimeWatched = (animeId: string, episodeId?: string) => {
  const [hasWatchedAnime, setHasWatchedAnime] = useState(false);
  const [hasWatchedEpisode, setHasWatchedEpisode] = useState(false);

  useEffect(() => {
    const watchedDetails: Array<IWatchedAnime> =
      JSON.parse(localStorage.getItem("watched") as string) || [];

    if (!Array.isArray(watchedDetails)) {
      localStorage.removeItem("watched");
      return;
    }

    const anime = watchedDetails.find(
      (watchedAnime) => watchedAnime.anime.id === animeId,
    );

    if (anime) {
      setHasWatchedAnime(true); // Anime has been watched
      if (episodeId) {
        const episodeWatched = anime.episodes.includes(episodeId);
        setHasWatchedEpisode(episodeWatched); // Set to true if the episode is watched
      }
    } else {
      setHasWatchedAnime(false); // Anime has not been watched
      setHasWatchedEpisode(false); // Episode has not been watched
    }
  }, [animeId, episodeId]);

  return { hasWatchedAnime, hasWatchedEpisode };
};
