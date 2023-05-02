"use client";
import React, { useEffect, useState } from "react";
import AnimeCard from "@/components/AnimeCard";
import useLocalStorage from "@/hooks/useLocalStorage";

function ContinueWatching() {
  const { getKitsuneWatched } = useLocalStorage();
  const [animes, setAnimes] = useState<any | null>(null);

  useEffect(() => {
    setAnimes(getKitsuneWatched());
  }, []);

  return animes !== null ? (
    <div className="mt-10">
      <p className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest text-center lg:text-start">
        Continue Watching
      </p>
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
