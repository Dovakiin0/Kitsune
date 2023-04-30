"use client";
import React, { createRef, useRef } from "react";
import { TAnimeInfoEpisode, TAnimeInfo } from "@/@types/AnimeType";
import Link from "next/link";
import EpisodeDisplay from "../components/EpisodeDisplay";

type EpisodeLayoutProps = {
  animeInfo: TAnimeInfo;
  episode: TAnimeInfoEpisode;
};

function EpisodeLayout({ animeInfo, episode }: EpisodeLayoutProps) {
  const curRef = useRef<null | HTMLDivElement>(null);
  let refs = animeInfo.episodes.reverse().reduce((acc: any, value) => {
    acc[value.number] = createRef();
    return acc;
  }, {});

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
          <Link
            href={`/anime/${animeInfo.id}/watch?ep=${ep.id}`}
            key={index}
            className={"w-full lg:w-[320px]"}
            ref={refs[ep.number]}
          >
            <EpisodeDisplay
              ep={ep}
              backSrc={animeInfo.image}
              isCurrent={episode.id === ep.id}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EpisodeLayout;
