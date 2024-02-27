"use client";
import React from "react";
import KitsunePlayer from "@/components/KitsunePlayer";
import { FaBackward, FaForward } from "react-icons/fa";
import EpisodeLayout from "./EpisodeLayout";
import dmcaJSON from "@/assets/dmca.json";
import { IAnimeInfo, IEpisodes } from "@/@types/AnimeType";

type Props = {
  episode: IEpisodes;
  animeInfo: IAnimeInfo;
};

function EpisodeFrame({ episode, animeInfo }: Props) {
  const onNext = () => {
    if (animeInfo.episodes.at(-1)?.number === episode.number) return;
    window.location.href = `/anime/${animeInfo.id}/watch?ep=${animeInfo.episodes[episode.number - 1 + 1]?.id
      }`;
  };

  const onPrev = () => {
    if (episode.number === 1) return;
    window.location.href = `/anime/${animeInfo.id}/watch?ep=${animeInfo.episodes[episode.number - 1 - 1]?.id
      }`;
  };

  return (
    <>
      {dmcaJSON.animes.includes(animeInfo.id) ? (
        <div className="md:h-[800px] h-[250px] w-full bg-black text-white flex items-center justify-center">
          This content has been removed due to a DMCA takedown notice.
        </div>
      ) : (
        <KitsunePlayer episodeInfo={episode} animeInfo={animeInfo} />
      )}
      <div className="flex justify-between items-center lg:p-5 p-2 gap-5">
        <FaBackward
          size={25}
          className="hover:text-primary cursor-pointer"
          onClick={onPrev}
        />

        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-400">
          Episode {episode?.number}
        </p>

        <FaForward
          size={25}
          className="hover:text-primary cursor-pointer"
          onClick={onNext}
        />
      </div>
      <div className="lg:pl-5 lg:pr-5">
        <EpisodeLayout animeInfo={animeInfo} episode={episode} />
      </div>
    </>
  );
}

export default EpisodeFrame;
