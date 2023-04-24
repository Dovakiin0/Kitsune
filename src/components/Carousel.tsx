"use client";
import { TSpotlightAnime } from "@/@types/AnimeType";
import Link from "next/link";
import React from "react";
import { Carousel as ReactCarousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

type CarouselProps = {
  spotlightInfo: TSpotlightAnime[];
};

function Carousel({ spotlightInfo }: CarouselProps) {
  return (
    <ReactCarousel autoPlay infiniteLoop dynamicHeight>
      {spotlightInfo.map((anime: TSpotlightAnime, index: number) => (
        <CarouselSingle
          key={index}
          id={index}
          src={anime.image}
          title={anime.title}
          description={anime.description}
          spotlight={anime.spotlight}
          episodeId={anime.episodeId}
        />
      ))}
    </ReactCarousel>
  );
}

type CarouselSingleProps = {
  id: number;
  src: string;
  title: string;
  description: string;
  spotlight: string;
  episodeId: string;
};

function CarouselSingle({
  id,
  src,
  title,
  description,
  spotlight,
  episodeId,
}: CarouselSingleProps) {
  return (
    <div id={`slide${id}`} className="relative w-full h-[350px] lg:h-[600px]">
      <img
        src={src}
        className="w-full h-full object-cover lg:opacity-50 opacity-30"
      />
      <div className="absolute flex flex-col text-start items-start space-y-5 lg:left-20 left-5 top-10 lg:top-1/4 w-1/2 h-3/4 overflow-hidden">
        <p className="lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 ">
          {spotlight}
        </p>
        <p className="text-xl lg:text-5xl font-extrabold ">{title}</p>
        <p className="font-extralight text-sm lg:text-md text-gray-200 leading-relaxed line-clamp-6 lg:line-clamp-none">
          {description}
        </p>
        <div>
          <Link
            href={`/anime/${episodeId}/watch`}
            className="btn bg-pink-200 text-primary-content btn-sm lg:btn-md hover:bg-pink-300"
          >
            Watch Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Carousel;
