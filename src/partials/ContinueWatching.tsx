"use client";
import React, { useEffect, useState } from "react";
import AnimeCard from "@/components/AnimeCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { AiOutlineFieldTime } from "react-icons/ai";

function ContinueWatching() {
  const { getKitsuneWatched } = useLocalStorage();
  const [animes, setAnimes] = useState<any | null>(null);

  useEffect(() => {
    setAnimes(getKitsuneWatched());
  }, []);

  return animes !== null ? (
    <div className="mt-40">
      <div className="flex space-x-5 items-center mb-10 text-pink-200">
        <p className="text-xl uppercase font-bold tracking-widest text-center lg:text-start">
          Continue Watching
        </p>
        <AiOutlineFieldTime size={35} />
      </div>
      <div className="flex flex-wrap justify-between lg:justify-start xl:gap-8 lg:gap-6 gap-3 m-2 lg:m-0">
        {Object.keys(animes)
          .reverse()
          .map((key: string) => (
            <AnimeCard
              id={animes[key].id}
              key={animes[key].id}
              title={
                animes[key].title !== ""
                  ? animes[key].title
                  : animes[key].id.split("-").join(" ").toString()
              }
              src={animes[key].image}
              additional={`Episode: ${animes[key].ep[animes[key].ep.length - 1].number
                }`}
              episodeId={animes[key].ep[animes[key].ep.length - 1].id}
            />
          ))}
      </div>
    </div>
  ) : (
    <></>
  );
}

export default ContinueWatching;
