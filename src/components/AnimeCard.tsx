"use client";
import React from "react";
import { FaPlay } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type AnimeProps = {
  id: string;
  title: string;
  src: string;
  additional: string;
  episodeId?: string;
};

function AnimeCard({ id, title, src, additional, episodeId }: AnimeProps) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-[180px] lg:w-[200px] rounded-lg hover:cursor-pointer"
      onClick={() =>
        router.push(
          `/anime/${encodeURIComponent(id)}/watch${episodeId ? "?ep=" + episodeId : ""
          }`
        )
      }
    >
      <div className="flex flex-col space-y-2 justify-between bg-base-300 shadow-xl">
        <div className="w-full h-[250px]">
          <img
            src={src}
            alt={title}
            className="w-full h-full delay-50 object-cover rounded-lg"
          />
        </div>
        <div className="m-2 flex flex-col space-y-3">
          <p className="font-bold text-sm capitalize truncate">{title}</p>
          <div className="flex item-center justify-between">
            <p className="text-accent text-xs">{additional}</p>
            <FaPlay />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AnimeCard;
