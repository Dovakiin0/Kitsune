"use client";
import React from "react";
import { motion } from "framer-motion";
import { IEpisodes } from "@/@types/AnimeType";

type EpisodeDisplayProps = {
  ep: IEpisodes;
  backSrc: string;
  isCurrent: boolean;
  watched?: boolean;
  mini?: boolean;
};

function EpisodeDisplay({
  ep,
  isCurrent,
  watched = false,
}: EpisodeDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`w-20 h-20 rounded-lg relative hover:cursor-pointer flex items-center justify-center ${isCurrent && "bg-pink-600"} ${watched ? "bg-base-300" : "bg-gray-700"
        }`}
    >
      <p> EP {ep.number} </p>
    </motion.div>
  );
}

export default EpisodeDisplay;
