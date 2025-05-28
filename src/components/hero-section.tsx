"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";

import Container from "./container";
import { Button } from "./ui/button";
import parse from "html-react-parser";

import React from "react";
import { ArrowLeft, ArrowRight, Captions, Mic } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { ButtonLink } from "./common/button-link";
import { SpotlightAnime } from "@/types/anime";
import { Badge } from "./ui/badge";

type IHeroSectionProps = {
  spotlightAnime: SpotlightAnime[];
  isDataLoading: boolean;
};

const HeroSection = (props: IHeroSectionProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  if (props.isDataLoading) return <LoadingSkeleton />;

  return (
    <div className="h-[80vh] w-full relative">
      <Carousel className="w-full" setApi={setApi} opts={{}}>
        <CarouselContent className="">
          {props?.spotlightAnime.map((anime, index) => (
            <CarouselItem key={index}>
              <HeroCarouselItem anime={anime} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute hidden md:flex items-center gap-5 right-10 3xl:bottom-10 bottom-24 z-50 isolate">
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

const HeroCarouselItem = ({ anime }: { anime: SpotlightAnime }) => {
  // const [isHovered, setIsHovered] = useState(false);

  // const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null); // Use ref to store the timeout ID

  // const handleMouseEnter = () => {
  //   hoverTimeoutRef.current = setTimeout(() => {
  //     setIsHovered(true);
  //   }, 1500);
  // };

  // const handleMouseLeave = () => {
  //   if (hoverTimeoutRef.current) {
  //     clearTimeout(hoverTimeoutRef.current); // Clear the timeout when mouse leaves
  //   }
  //   setIsHovered(false);
  // };

  return (
    <div
      className={`w-full bg-cover bg-no-repeat bg-center h-[80vh] relative`}
      style={{ backgroundImage: `url(${anime?.poster})` }}
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
    >
      {/* {isHovered && (
        <div className="absolute inset-0 z-0">
          <iframe
            className="w-full h-full object-cover"
            src={`https://www.youtube.com/embed/${anime?.trailer.id}?autoplay=1&mute=0&controls=0&modestbranding=1`}
            title="YouTube video player"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      )} */}

      {/* Gradient Overlay */}
      <div className="absolute h-full w-full inset-0 m-auto bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
      <div className="absolute h-full w-full inset-0 m-auto bg-gradient-to-t from-slate-900 to-transparent z-10"></div>

      {/* Content Section (remains outside the hover area) */}
      <div className="w-full h-[calc(100%-5.25rem)]  relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-10">
          <div className="space-y-2 lg:w-[40vw]">
            {/* Title and description moved inside the hover area */}
            <h1 className="text-4xl font-black">{anime?.name}</h1>

            <div className="flex flex-row items-center space-x-2 ">
              {anime.episodes.sub && (
                <Badge className="bg-red-200 flex flex-row items-center space-x-0.5">
                  <Captions size={"16"} />
                  <span>{anime.episodes.sub}</span>
                </Badge>
              )}
              {anime.episodes.dub && (
                <Badge className="bg-green-200 flex flex-row items-center space-x-0.5">
                  <Mic size={"16"} />
                  <span>{anime.episodes.dub}</span>
                </Badge>
              )}
            </div>

            <p className="text-lg line-clamp-4">
              {parse(anime?.description as string)}
            </p>
            <div className="flex items-center gap-5 !mt-5">
              <ButtonLink
                href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                className="h-10 text-md bg-[#e9376b] text-white hover:bg-[#e9376b]"
              >
                Learn More
              </ButtonLink>
              {/* <ButtonLink href={`${ROUTES.WATCH}?anime=${anime.id}&episode=${}`} className="h-10 text-md" variant={"secondary"}>
                Watch
              </ButtonLink> */}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="h-[80vh] w-full relative">
      <div className="w-full h-[calc(100%-5.25rem)] mt-[5.25rem] relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-10">
          <div className="space-y-2 lg:w-[40vw]">
            <div className="h-16 animate-pulse bg-slate-700 w-[75%]"></div>
            <div className="h-40 animate-pulse w-full bg-slate-700"></div>
            <div className="flex items-center gap-5">
              <span className="h-10 w-[7.5rem] animate-pulse bg-slate-700"></span>
              <span className="h-10 w-[7.5rem] animate-pulse bg-slate-700"></span>
            </div>
          </div>
        </Container>
      </div>
      <div className="absolute hidden md:flex items-center gap-5 right-10 bottom-32 z-50 isolate">
        <span className="h-10 w-10 rounded-full animate-pulse bg-slate-700"></span>
        <span className="h-10 w-10 rounded-full animate-pulse bg-slate-700"></span>
      </div>
    </div>
  );
};
export default HeroSection;
