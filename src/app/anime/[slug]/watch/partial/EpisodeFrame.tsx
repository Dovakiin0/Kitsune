"use client";
import React from "react";
import KitsunePlayer from "@/components/KitsunePlayer";
import { FaBackward, FaForward } from "react-icons/fa";
import EpisodeLayout from "./EpisodeLayout";
import { Episode, IAnime } from "@/@types/EnimeType";

type Props = {
  episode: Episode;
  animeInfo: IAnime;
};

function EpisodeFrame({ episode, animeInfo }: Props) {
  return (
    <>
      <KitsunePlayer episodeInfo={episode} animeInfo={animeInfo} />

      <div className="flex justify-between items-center lg:p-5 p-2 gap-5">
        <a
          href={`/anime/${animeInfo.slug}/watch?ep=${animeInfo.episodes[episode.number - 1 - 1]?.id
            }`}
        >
          <FaBackward size={25} className="hover:text-primary cursor-pointer" />
        </a>

        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-400">
          Episode {episode?.number}
        </p>
        <a
          href={`/anime/${animeInfo.slug}/watch?ep=${animeInfo.episodes[episode.number - 1 + 1]?.id
            }`}
        >
          <FaForward size={25} className="hover:text-primary cursor-pointer" />
        </a>
      </div>
      <div className="lg:pl-5 lg:pr-5">
        <EpisodeLayout animeInfo={animeInfo} episode={episode} />
      </div>
    </>
  );
}

export default EpisodeFrame;
