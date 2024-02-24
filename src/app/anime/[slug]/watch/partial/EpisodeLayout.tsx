"use client";
import React, { createRef, useRef, useEffect, useState } from "react";
import { IAnimeInfo, IEpisodes, TWatchedAnime } from "@/@types/AnimeType";
import EpisodeDisplay from "../components/EpisodeDisplay";
import useLocalStorage from "@/hooks/useLocalStorage";

type EpisodeLayoutProps = {
  animeInfo: IAnimeInfo;
  episode: IEpisodes;
};

function EpisodeLayout({ animeInfo, episode }: EpisodeLayoutProps) {
  const { setKitsuneWatched, getKitsuneWatchedId } = useLocalStorage();
  const curRef = useRef<null | HTMLDivElement>(null);
  const [watched, setWatched] = useState<TWatchedAnime | null>(null);
  let refs = animeInfo.episodes.reduce((acc: any, value) => {
    acc[value.number] = createRef();
    return acc;
  }, {});

  useEffect(() => {
    if (animeInfo.episodes.length <= 0) return;
    setWatched(getKitsuneWatchedId(animeInfo.id));
    setKitsuneWatched({
      id: animeInfo.id,
      title: animeInfo.title,
      image: animeInfo.image,
      ep: {
        id: episode.id,
        number: episode.number,
      },
    });
  }, []);

  const onSearch = (e: any) => {
    e.preventDefault();
    let ep = Number(e.target.value);
    if (ep <= 0) return;
    if (!refs[ep]) return;
    curRef.current = refs[ep].current;
    if (curRef.current) {
      curRef.current.scrollIntoView();
      curRef.current.classList.add("animate-bounce");
      setTimeout(() => {
        curRef.current?.classList.remove("animate-bounce");
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col gap-5 mb-10 mt-10 ml-3 mr-3 lg:ml-0 lg:mr-0 lg:m-10 lg:mb-5 ">
      <div className="flex flex-col lg:flex-row justify-between items-center">
        <div className="flex items-center gap-5 order-2 lg:order-1 w-full lg:w-1/2">
          <p className="text-2xl uppercase font-bold">Episodes</p>
          <input
            type="text"
            className="input input-sm w-full"
            placeholder="Search"
            onChange={onSearch}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-5 max-h-[90vh] overflow-y-auto">
        {animeInfo.episodes.length > 0 ? (
          animeInfo.episodes.map((ep: IEpisodes, index: number) => (
            <div key={index} ref={refs[ep.number]}>
              <a href={`/anime/${animeInfo.id}/watch?ep=${ep.id}`}>
                <EpisodeDisplay
                  ep={ep}
                  backSrc={animeInfo.image}
                  isCurrent={episode.id === ep.id}
                  watched={watched?.ep.some((e) => e.number === ep.number)}
                />
              </a>
            </div>
          ))
        ) : (
          <div className="w-full h-[150px] flex items-center justify-center">
            <p className="font-bold uppercase text-gray-400">No Episodes</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EpisodeLayout;
