"use client";

import React from "react";
import AnimeCard from "./anime-card";
import { IAnime } from "@/types/anime";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import Button from "./common/custom-button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import BlurFade from "./ui/blur-fade";
import { ROUTES } from "@/constants/routes";

type Props = {
  anime: IAnime[];
  title: string;
  className?: string;
};

const AnimeCarousel = (props: Props) => {
  const [api, setApi] = React.useState<CarouselApi>();

  return (
    <div className={cn(["flex flex-col gap-5", props.className])}>
      <div className="w-full flex items-center justify-between">
        <h5 className="text-2xl font-bold">{props.title}</h5>
        <div className="flex items-center gap-5">
          <Button
            onClick={() => {
              api?.scrollPrev();
            }}
            className="rounded-full bg-transparent border border-white h-10 w-10 hover:bg-slate-500"
          >
            <ArrowLeft className="text-white shrink-0" />
          </Button>
          <Button
            onClick={() => api?.scrollNext()}
            className="rounded-full bg-transparent border border-white h-10 w-10 hover:bg-slate-500"
          >
            <ArrowRight className="text-white shrink-0" />
          </Button>
        </div>
      </div>
      <Carousel className="w-full" setApi={setApi} opts={{}}>
        <CarouselContent className="w-full">
          {props.anime?.map((ani, idx) => (
            <BlurFade key={idx} delay={idx * 0.05} inView>
              <CarouselItem
                key={idx}
                className="lg:basis-[1/5] basis-[1/2] sm:basis-[1/3] md:basis-[1/4] xl:basis-[1/6] 2xl:basis-[1/7]"
              >
                <AnimeCard
                  key={idx}
                  title={ani.name}
                  subTitle={ani.type}
                  episodeCard
                  sub={ani.episodes.sub}
                  dub={ani.episodes.dub}
                  href={`${ROUTES.ANIME_DETAILS}/${ani.id}`}
                  poster={ani.poster}
                  className="self-center justify-self-center min-w-[12rem]"
                />
              </CarouselItem>
            </BlurFade>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default AnimeCarousel;
