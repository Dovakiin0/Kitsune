"use client";
import React from "react";
import { motion } from "framer-motion";
import { TAnimeInfoEpisode } from "@/@types/AnimeType";

type EpisodeDisplayProps = {
  ep: TAnimeInfoEpisode;
  backSrc: string;
};

function EpisodeDisplay({ ep, backSrc }: EpisodeDisplayProps) {
  const thumbnail = ep.kitsu?.attributes!.thumbnail;

  const src = thumbnail ? thumbnail.original : backSrc;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1, rotateZ: 2 }}
      whileTap={{ scale: 0.9 }}
      className="w-full lg:w-[320px] h-[150px] rounded-lg relative hover:cursor-pointer"
    >
      <img
        src={src}
        className="object-cover w-full h-full rounded-lg opacity-50"
      />
      <div className="absolute bottom-0 m-5 p-2">
        <p className="font-bold">
          EP {ep.number} {ep.kitsu?.attributes.titles.en}
        </p>
      </div>
    </motion.div>
  );
}

export default EpisodeDisplay;
