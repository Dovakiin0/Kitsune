"use client";

import Loading from "@/app/loading";
import parse from "html-react-parser";
import { ROUTES } from "@/constants/routes";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { useAnimeStore } from "@/store/anime-store";

import EpisodePlaylist from "@/components/episode-playlist";

import { useRouter, useSearchParams } from "next/navigation";
import { useGetAnimeDetails } from "@/query/get-anime-details";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import AnimeCarousel from "@/components/anime-carousel";
import { IAnime } from "@/types/anime";

type Props = {
  children: ReactNode;
};

const Layout = (props: Props) => {
  const searchParams = useSearchParams();
  const { setAnime, setSelectedEpisode } = useAnimeStore();
  const router = useRouter();

  const currentAnimeId = useMemo(
    () => searchParams.get("anime"),
    [searchParams],
  );
  const episodeId = searchParams.get("episode");

  const [animeId, setAnimeId] = useState<string | null>(currentAnimeId);

  useEffect(() => {
    if (currentAnimeId !== animeId) {
      setAnimeId(currentAnimeId);
    }

    if (episodeId) {
      setSelectedEpisode(episodeId);
    }
  }, [currentAnimeId, episodeId, animeId, setSelectedEpisode]);

  const { data: anime, isLoading } = useGetAnimeDetails(animeId as string);

  useEffect(() => {
    if (anime) {
      setAnime(anime);
    }
  }, [anime, setAnime]);

  useEffect(() => {
    if (!animeId) {
      router.push(ROUTES.HOME);
    }
    //eslint-disable-next-line
  }, [animeId]);

  if (isLoading) return <Loading />;

  return (
    anime?.anime.info && (
      <Container className="mt-[6.5rem] space-y-10 pb-20">
        <div className="grid lg:grid-cols-4 grid-cols-1 gap-y-5 gap-x-10 w-full">
          <div className="lg:col-span-3 col-span-1 mb-32 lg:mb-0">
            {props.children}
          </div>

          <EpisodePlaylist
            animeId={animeId as string}
            title={
              !!anime?.anime.info.name
                ? anime.anime.info.name
                : (anime?.anime.moreInfo.japanese as string)
            }
            subOrDub={anime?.anime.info.stats.episodes}
          />
        </div>
        <div className="flex md:flex-row flex-col gap-5 -mt-5">
          <AnimeCard
            title={anime?.anime.info.name}
            poster={anime?.anime.info.poster}
            subTitle={anime?.anime.moreInfo.aired}
            displayDetails={false}
            className="!h-full !rounded-sm"
            href={ROUTES.ANIME_DETAILS + "/" + anime?.anime.info.id}
          />
          <div className="flex flex-col gap-2">
            <h1
              className="text-2xl md:font-black font-extrabold z-[100] cursor-pointer"
              onClick={() => {
                router.push(ROUTES.ANIME_DETAILS + "/" + anime?.anime.info.id);
              }}
            >
              {anime?.anime.info.name}
            </h1>
            <p>{parse(anime?.anime.info.description as string)}</p>
          </div>
        </div>
        <AnimeCarousel
          title={"Also Watch"}
          anime={anime?.relatedAnimes as IAnime[]}
        />
        <AnimeCarousel
          title={"Recommended"}
          anime={anime?.recommendedAnimes as IAnime[]}
        />
      </Container>
    )
  );
};
export default Layout;
