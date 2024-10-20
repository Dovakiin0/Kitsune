"use client";

import Loading from "@/app/loading";
import AnimeCard from "@/components/anime-card";
import Container from "@/components/container";
import EpisodePlaylist from "@/components/episode-playlist";
import Recommendations from "@/components/recommendation";
import { ROUTES } from "@/constants/routes";
import { useGetAnimeDetails } from "@/query/get-anime-details";
import { useAnimeStore } from "@/store/anime-store";
import { Ation, IAnimeDetails } from "@/types/anime-details";
import { useRouter, useSearchParams } from "next/navigation";
import React, { ReactNode, useEffect, useMemo, useState } from "react";

import parse from "html-react-parser";

type Props = {
  children: ReactNode;
};

const Layout = (props: Props) => {
  const searchParams = useSearchParams();
  const { setAnime, setSelectedEpisode } = useAnimeStore();
  const router = useRouter();

  const currentAnimeId = useMemo(
    () => searchParams.get("anime"),
    [searchParams]
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
    <Container className="mt-[6.5rem] space-y-10 pb-20">
      <div className="grid lg:grid-cols-4 grid-cols-1 gap-y-5 gap-x-10 w-full">
        <div className="lg:col-span-3 col-span-1">{props.children}</div>

        <EpisodePlaylist
          animeId={animeId as string}
          title={
            !!anime?.title.english
              ? anime.title.english
              : (anime?.title.userPreferred as string)
          }
        />
      </div>
      <div className="flex md:flex-row flex-col gap-5 -mt-5">
        <AnimeCard
          anime={anime as IAnimeDetails}
          displayDetails={false}
          className="!h-full !rounded-sm"
        />
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl md:font-black font-extrabold z-[100] cursor-pointer"
            onClick={() => {
              router.push(ROUTES.ANIME_DETAILS + "/" + anime?.id);
            }}
          >
            {!!anime?.title.english ? anime.title.english : anime?.title.romaji}
          </h1>
          <p>{parse(anime?.description as string)}</p>
        </div>
      </div>
      <Recommendations recommendations={anime?.recommendations as Ation[]} />
    </Container>
  );
};
export default Layout;

