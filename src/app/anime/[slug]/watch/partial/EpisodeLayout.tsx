"use client";
import React, { createRef, useEffect, useRef, useState } from "react";
import {
  TAnimeInfoEpisode,
  TAnimeInfo,
  TWatchedAnime,
} from "@/@types/AnimeType";
import EpisodeDisplay from "../components/EpisodeDisplay";
import useLocalStorage from "@/hooks/useLocalStorage";

type EpisodeLayoutProps = {
  animeInfo: TAnimeInfo;
  episode: TAnimeInfoEpisode;
};

function EpisodeLayout({ animeInfo, episode }: EpisodeLayoutProps) {
  const { setKitsuneWatched, getKitsuneWatchedId } = useLocalStorage();
  const curRef = useRef<null | HTMLDivElement>(null);
  const [watched, setWatched] = useState<TWatchedAnime | null>(null);
  let refs = animeInfo.episodes.reduce((acc: any, value) => {
    acc[value.number] = createRef();
    return acc;
  }, {});

  console.log(animeInfo);

  useEffect(() => {
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
    }
  };

  return (
    <div className="flex flex-col gap-5 mb-10 mt-10 ml-3 mr-3 lg:ml-0 lg:mr-0 lg:m-10 lg:mb-5 ">
      <div className="flex items-center gap-10">
        <p className="text-2xl uppercase font-bold">Episodes</p>
        <input
          type="text"
          className="input input-sm"
          placeholder="Search"
          onChange={onSearch}
        />
      </div>
      <div className="flex flex-wrap gap-5 max-h-[90vh] overflow-y-auto">
        {animeInfo.episodes.map((ep: TAnimeInfoEpisode, index: number) => (
          <div
            key={index}
            className={"w-full lg:w-[320px]"}
            ref={refs[ep.number]}
          >
            <a href={`/anime/${animeInfo.id}/watch?ep=${ep.id}`}>
              <EpisodeDisplay
                ep={ep}
                backSrc={animeInfo.image}
                isCurrent={episode.id === ep.id}
                watched={
                  watched
                    ? watched.ep.some(
                      (e: { id: string; number: number }) => e.id === ep.id
                    )
                    : false
                }
              />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EpisodeLayout;
