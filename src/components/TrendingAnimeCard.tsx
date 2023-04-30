"use client";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { IKitsuAnime } from "@/@types/KitsuAnime";

type TrendingAnimeCardProps = {
  anime: IKitsuAnime;
  index: number;
};

function TrendingAnimeCard({ anime, index }: TrendingAnimeCardProps) {
  function getPositionWithStyle(position: number) {
    if (position === 1) {
      return (
        <p className="text-2xl text-primary border-b-4 border-b-white">
          {position}
        </p>
      );
    }
    if (position === 2) {
      return (
        <p className="text-2xl text-secondary border-b-4 border-b-white">
          {position}
        </p>
      );
    }
    if (position === 3) {
      return (
        <p className="text-2xl text-accent border-b-4 border-b-white">
          {position}
        </p>
      );
    }
    return <p className="text-2xl">{position}</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      whileHover={{ scale: 1.1, rotateZ: 2 }}
      whileTap={{ scale: 0.9 }}
    >
      <Link
        href={`/anime/${anime.attributes.slug}/watch`}
        className="flex items-center space-x-5 bg-base-300 p-3 rounded-md w-full"
      >
        {getPositionWithStyle(index + 1)}
        <img
          src={anime.attributes.posterImage.original}
          width={50}
          height={50}
          className="object-contain rounded-lg shadow-lg"
        />
        <p className="font-bold">{anime.attributes.canonicalTitle}</p>
      </Link>
    </motion.div>
  );
}

export default TrendingAnimeCard;
