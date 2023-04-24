import { TSpotlightAnime } from "@/@types/AnimeType";
import useAnime from "@/hooks/useAnime";
import React from "react";

type CarouselProps = {
  spotlightInfo: TSpotlightAnime[];
};

function Carousel({ spotlightInfo }: CarouselProps) {
  return (
    <div className="carousel w-full h-[350px] lg:h-[600px]">
      {spotlightInfo.map((anime: TSpotlightAnime, index: number) => (
        <CarouselSingle
          key={index}
          id={index}
          src={anime.image}
          next={index === spotlightInfo.length - 1 ? 0 : index + 1}
          prev={index === 0 ? spotlightInfo.length - 1 : index - 1}
          title={anime.title}
          description={anime.description}
          spotlight={anime.spotlight}
        />
      ))}
    </div>
  );
}

type CarouselSingleProps = {
  id: number;
  src: string;
  next: number;
  prev: number;
  title: string;
  description: string;
  spotlight: string;
};

function CarouselSingle({
  id,
  src,
  next,
  prev,
  title,
  description,
  spotlight,
}: CarouselSingleProps) {
  return (
    <div id={`slide${id}`} className="carousel-item relative w-full">
      <img src={src} className="w-full object-cover lg:opacity-50 opacity-30" />
      <div className="absolute flex flex-col space-y-5 lg:left-20 left-5 top-10 lg:top-1/4 w-1/2 h-3/4 overflow-hidden">
        <p className="lg:text-2xl font-bold">{spotlight}</p>
        <p className="text-xl lg:text-5xl font-extrabold">{title}</p>
        <p className="font-extralight text-sm lg:text-md text-gray-200 leading-relaxed line-clamp-6 lg:line-clamp-none">
          {description}
        </p>
      </div>
      <div className="absolute flex flex-col space-y-5 transform -translate-y-1/2 right-10 top-1/2">
        <a href={`#slide${prev}`} className="btn btn-circle">
          ❮
        </a>
        <a href={`#slide${next}`} className="btn btn-circle">
          ❯
        </a>
      </div>
    </div>
  );
}

export default Carousel;
