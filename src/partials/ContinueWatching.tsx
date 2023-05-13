"use client";
import React, { useEffect, useState } from "react";
import AnimeCard from "@/components/AnimeCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { AiOutlineFieldTime } from "react-icons/ai";

function ContinueWatching() {
  const { getKitsuneWatched, delKitsuneWatched } = useLocalStorage();
  const [animes, setAnimes] = useState<any | null>(null);

  useEffect(() => {
    setAnimes(getKitsuneWatched());
  }, []);

  const onDelete = (key: string) => {
    delKitsuneWatched(key);
    setAnimes(getKitsuneWatched());
  };

  return animes !== null && Object.keys(animes).length > 0 ? (
    <div className="mt-20 lg:mt-30">
      <div className="flex space-x-5 items-center mb-10 text-pink-200 justify-center lg:justify-start">
        <p className="text-xl uppercase font-bold tracking-widest lg:text-start">
          Continue Watching
        </p>
        <AiOutlineFieldTime size={35} />
      </div>
      <div className="flex flex-wrap justify-evenly lg:justify-start xl:gap-8 lg:gap-6 gap-3 m-2 lg:m-0">
        {Object.keys(animes)
          .reverse()
          .map((key: string) => (
            <AnimeCard
              id={animes[key].id}
              key={animes[key].id}
              title={animes[key].title}
              src={animes[key].image}
              additional={`Episode: ${animes[key].ep[animes[key].ep.length - 1].number
                }`}
              episodeId={animes[key].ep[animes[key].ep.length - 1].id}
              hasRemoveBtn={true}
              delCb={() => onDelete(key)}
            />
          ))}
      </div>
    </div>
  ) : (
    <></>
  );
}

export default ContinueWatching;
