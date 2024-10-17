"use client";

import React, { useState } from "react";
import Container from "./container";
import { Button } from "./ui/button";
import { useGetTrendingAnime } from "@/query/get-trending-anime";
import parse from "html-react-parser";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import { IAnime } from "@/types/anime";
import { ArrowLeft, ArrowRight } from "lucide-react";

const HeroSection = () => {
  const { data, isLoading } = useGetTrendingAnime();

  const [api, setApi] = React.useState<CarouselApi>();

  if (isLoading) return <>Loading</>;

  return (
    <div className="h-[80vh] w-full relative">
      <Carousel className="w-full" setApi={setApi} opts={{}}>
        <CarouselContent className="">
          {data?.results.map((anime, index) => (
            <CarouselItem key={index}>
              <HeroCarouselItem anime={anime} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute hidden md:flex items-center gap-5 right-10 bottom-0 z-50 isolate">
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
  );
};

const HeroCarouselItem = ({ anime }: { anime: IAnime }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`w-full bg-cover bg-no-repeat bg-center h-[80vh] relative`}
      style={{ backgroundImage: `url(${anime?.cover})` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div className="absolute inset-0 z-0">
          <iframe
            className="w-full h-full object-cover"
            src={`https://www.youtube.com/embed/${anime?.trailer.id}?autoplay=1&mute=0&controls=0&modestbranding=1`}
            title="YouTube video player"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute h-full w-full inset-0 m-auto bg-gradient-to-r from-slate-900 to-transparent z-10"></div>

      {/* Content Section (remains outside the hover area) */}
      <div className="w-full h-[calc(100%-5.25rem)] mt-[5.25rem] relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-10">
          <div className="space-y-2 lg:w-[40vw]">
            {/* Title and description moved inside the hover area */}
            <h1 className="text-4xl font-black">{anime?.title.english}</h1>
            <p className="text-lg line-clamp-4">
              {parse(anime?.description as string)}
            </p>
            <div className="flex items-center gap-5">
              <Button className="h-10 text-md">Learn More</Button>
              <Button className="h-10 text-md" variant={"secondary"}>
                To Watch
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HeroSection;

