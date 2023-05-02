"use client";
import React from "react";
import { motion } from "framer-motion";
import { TAnimeInfoEpisode } from "@/@types/AnimeType";

type EpisodeDisplayProps = {
  ep: TAnimeInfoEpisode;
  backSrc: string;
  isCurrent: boolean;
  watched?: boolean;
};

function EpisodeDisplay({
  ep,
  backSrc,
  isCurrent,
  watched = false,
}: EpisodeDisplayProps) {
  const thumbnail = ep.kitsu?.attributes!.thumbnail;

  const src = thumbnail ? thumbnail.original : backSrc;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-full h-[150px] rounded-lg relative hover:cursor-pointer"
    >
      <img
        src={src}
        className={`object-cover w-full h-full rounded-lg ${!isCurrent && "opacity-40"
          }`}
      />
      <div
        className={`absolute bottom-0 m-5 p-2 ${isCurrent && "bg-base-100 rounded-md"
          }`}
      >
        <p className={`font-bold`}>
          EP {ep.number} {ep.kitsu?.attributes.titles.en}
        </p>
      </div>
      {watched && (
        <div
          className={`badge badge-primary ${!isCurrent && "badge-outline"
            } absolute top-0 right-0 m-5`}
        >
          {isCurrent ? "Watching" : "Watched"}{" "}
        </div>
      )}
    </motion.div>
  );
}

export default EpisodeDisplay;
