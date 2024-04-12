"use client";
import React from "react";
import { FaPlay } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AnimeProps = {
  id: string;
  title: string;
  src: string;
  additional: string;
  episodeId?: string;
  hasRemoveBtn?: boolean;
  delCb?: () => void;
};

function AnimeCard({
  id,
  title,
  src,
  additional,
  episodeId,
  hasRemoveBtn = false,
  delCb,
}: AnimeProps) {
  const router = useRouter();
  return (
    <motion.div
      className="relative w-[180px] h-[250px] lg:h-[300px] lg:w-[200px] rounded-lg hover:cursor-pointer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { delay: 0.05 } }}
      whileHover={{ scale: 1.1 }}
    >
      {hasRemoveBtn && (
        <div
          className="absolute right-5 top-5 bg-base-100 shadow-xl rounded-full p-2 text-white hover:bg-white hover:text-red-600 transition-all ease-in-out z-10"
          onClick={delCb}
        >
          <RxCross1 size="15" />
        </div>
      )}

      <Link href={`/anime/${encodeURIComponent(id)}/watch${episodeId ? "?ep=" + episodeId : ""}`} >
        <motion.div
          whileTap={{ scale: 0.9 }}
        >
          <div className="flex flex-col space-y-2 justify-between bg-base-300 shadow-xl relative">
            <img
              src={src}
              alt={title}
              className="w-full h-[250px] lg:h-[300px] delay-50 object-cover rounded-lg"
            />
            <div className="absolute bottom-0 p-2 flex flex-col w-full bg-gradient-to-b from-transparent to-pink-900">
              <p className="font-extrabold text-sm capitalize truncate">
                {title}
              </p>
              <div className="flex item-center justify-between">
                <p className="text-xs">{additional}</p>
                <FaPlay />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default AnimeCard;
