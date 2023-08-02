"use client";
import React from "react";
import { motion } from "framer-motion";
import { Episode } from "@/@types/EnimeType";

type EpisodeDisplayProps = {
  ep: Episode;
  backSrc: string;
  isCurrent: boolean;
  watched?: boolean;
  mini?: boolean;
};

function EpisodeDisplay({
  ep,
  backSrc,
  isCurrent,
  watched = false,
  mini = false,
}: EpisodeDisplayProps) {
  return mini ? (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-20 h-20 bg-gray-700 rounded-lg relative hover:cursor-pointer flex items-center justify-center"
    >
      <p> EP {ep.number} </p>
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-full h-[150px] rounded-lg relative hover:cursor-pointer"
    >
      <img
        src={ep.image || backSrc}
        className={`object-cover w-full h-full rounded-lg ${!isCurrent && "opacity-40"
          }`}
      />
      <div
        className={`absolute bottom-0 m-5 p-2 ${isCurrent && "bg-base-100 bg-opacity-60 rounded-md"
          }`}
      >
        <p className={`font-bold`}>
          EP {ep.number} {ep.title}
        </p>
      </div>
      {watched && (
        <div
          className={`badge badge-primary ${!isCurrent && "badge-outline"
            } absolute top-0 right-0 m-5`}
        >
          {isCurrent ? "Watching" : "Watched"}
        </div>
      )}
    </motion.div>
  );
}

export default EpisodeDisplay;
