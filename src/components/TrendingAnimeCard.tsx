import { TTrendingAnime } from "@/@types/AnimeType";
import Link from "next/link";
import React from "react";

type TrendingAnimeCardProps = {
  anime: TTrendingAnime;
};

function TrendingAnimeCard({ anime }: TrendingAnimeCardProps) {
  function getPositionWithStyle(position: string) {
    if (position === "01") {
      return (
        <p className="text-2xl text-primary border-b-4 border-b-white">
          {position}
        </p>
      );
    }
    if (position === "02") {
      return (
        <p className="text-2xl text-secondary border-b-4 border-b-white">
          {position}
        </p>
      );
    }
    if (position === "03") {
      return (
        <p className="text-2xl text-accent border-b-4 border-b-white">
          {position}
        </p>
      );
    }
    return <p className="text-2xl">{position}</p>;
  }

  return (
    <Link
      href={`/anime/${anime.episodeId}/watch`}
      className="flex items-center space-x-5 hover:scale-110 bg-base-300 p-3 rounded-md"
    >
      {getPositionWithStyle(anime.position)}
      <img
        src={anime.image}
        width={50}
        height={50}
        className="object-contain rounded-lg shadow-lg"
      />
      <p className="font-bold">{anime.title}</p>
    </Link>
  );
}

export default TrendingAnimeCard;
