"use client";

import React, { useEffect, useState } from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import { ROUTES } from "@/constants/routes";
import BlurFade from "./ui/blur-fade";
import { IAnime } from "@/types/anime";
import { History } from "lucide-react";
import useBookMarks, { WatchHistory } from "@/hooks/use-get-bookmark";
import { useAuthStore } from "@/store/auth-store";

type Props = {
  loading: boolean;
};

interface WatchedAnime extends IAnime {
  episode: WatchHistory | string;
}

const ContinueWatching = (props: Props) => {
  const [anime, setAnime] = useState<WatchedAnime[] | null>(null);

  const { auth } = useAuthStore();
  const { bookmarks } = useBookMarks({
    page: 1,
    per_page: 14,
    status: "watching",
  });

  useEffect(() => {
    if (!auth) {
      if (typeof window !== "undefined") {
        const storedData = localStorage.getItem("watched");
        const watchedAnimes: {
          anime: { id: string; title: string; poster: string };
          episodes: string[];
        }[] = storedData ? JSON.parse(storedData) : [];

        if (!Array.isArray(watchedAnimes)) {
          localStorage.removeItem("watched");
          return;
        }

        const animes = watchedAnimes.reverse().map((anime) => ({
          id: anime.anime.id,
          name: anime.anime.title,
          poster: anime.anime.poster,
          episode: anime.episodes[anime.episodes.length - 1],
        }));
        setAnime(animes as WatchedAnime[]);
      }
    } else {
      if (bookmarks && bookmarks.length > 0) {
        const animes = bookmarks.map((anime) => ({
          id: anime.animeId,
          name: anime.animeTitle,
          poster: anime.thumbnail,
          episode: anime.expand.watchHistory
            ? anime.expand.watchHistory.sort(
              (a, b) => b.episodeNumber - a.episodeNumber,
            )[0]
            : null,
        }));
        setAnime(animes as WatchedAnime[]);
      }
    }
  }, [auth, bookmarks]);

  if (props.loading) return <LoadingSkeleton />;

  if ((!anime || !anime.length) && !props.loading) return <></>;

  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start">
      <div className="flex items-center gap-2">
        <History />
        <h5 className="text-2xl font-bold">Continue Watching</h5>
      </div>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {anime?.map(
          (ani, idx) =>
            ani.episode && (
              <BlurFade key={idx} delay={idx * 0.05} inView>
                <AnimeCard
                  title={ani.name}
                  poster={ani.poster}
                  className="self-center justify-self-center"
                  href={`${ROUTES.WATCH}?anime=${ani.id}&episode=${typeof ani.episode !== "string" ? ani.episode.episodeId : ani.episode}`}
                  watchDetail={
                    typeof ani.episode !== "string" ? ani.episode : null
                  }
                />
              </BlurFade>
            ),
        )}
      </div>
    </Container>
  );
};

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start lg:mt-[10.125rem] z-20 ">
      <div className="h-10 w-[15.625rem] animate-pulse bg-slate-700"></div>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, idx) => {
          return (
            <div
              key={idx}
              className="rounded-xl h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem] animate-pulse bg-slate-700"
            ></div>
          );
        })}
      </div>
    </Container>
  );
};

export default ContinueWatching;
