"use client";

import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";

import BlurFade from "./ui/blur-fade";
import { IAnime } from "@/types/anime";
import { ROUTES } from "@/constants/routes";

type Props = {
  trendingAnime: IAnime[];
  loading: boolean;
  title: string;
};

const AnimeSections = (props: Props) => {
  if (props.loading) return <LoadingSkeleton />;
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
      <h5 className="text-2xl font-bold">{props.title}</h5>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {props.trendingAnime.map((anime, idx) => (
          <BlurFade key={idx} delay={idx * 0.05} inView>
            <AnimeCard
              title={anime.name}
              subTitle={anime.type ? anime.type : `Rank: ${anime.rank}`}
              poster={anime.poster}
              className="self-center justify-self-center"
              href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
              episodeCard
              sub={anime?.episodes?.sub}
              dub={anime?.episodes?.dub}
            />
          </BlurFade>
        ))}
      </div>
    </Container>
  );
};

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
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

export default AnimeSections;
