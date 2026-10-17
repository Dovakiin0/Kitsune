"use client";

import React from "react";

import { cn } from "@/lib/utils";

import { ROUTES } from "@/constants/routes";
import { Episode } from "@/types/episodes";
import { useAnimeStore } from "@/store/anime-store";
import { useHasAnimeWatched } from "@/hooks/use-is-anime-watched";
import { Captions, Mic } from "lucide-react";
import Link from "next/link";
import { WatchHistory } from "@/hooks/use-get-bookmark";

import { useSearchParams } from "next/navigation";

type Props = {
  className?: string;
  episode: Episode;
  showCard?: boolean;
  animeId: string;
  variant?: "card" | "list";
  subOrDub?: { sub: number; dub: number };
  watchedEpisodes?: WatchHistory[] | null;
};

const EpisodeCard = ({
  showCard = false,
  variant = "card",
  ...props
}: Props) => {
  const searchParams = useSearchParams();
  const epParam = searchParams.get("ep");
  const activeEpNum = epParam ? Number(epParam) : null;

  const { selectedEpisode } = useAnimeStore();
  const { hasWatchedEpisode } = useHasAnimeWatched(
    props.animeId,
    props.episode.episodeId,
    props.watchedEpisodes!,
    props.episode.number,
  );

  const isSelected =
    activeEpNum !== null
      ? activeEpNum === props.episode.number
      : selectedEpisode === props.episode.episodeId ||
        (!!selectedEpisode && selectedEpisode.endsWith(`/${props.episode.number}`));

  if (showCard && variant === "card") {
    return (
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer ",
          "h-[8.625rem] min-w-[8.625rem] max-w-[10.625rem] md:h-[10.75rem] md:max-w-[12.5rem]",
          props.className,
        ])}
      >
        <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
        <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3">
          <h5 className="line-clamp-1">{`${props.episode.number}. ${props.episode.title}`}</h5>
        </div>
      </div>
    );
  } else if (!showCard && variant === "card") {
    return (
      <Link
        href={`${ROUTES.WATCH}?anime=${props.animeId}&ep=${props.episode.number}`}
      >
        <div
          className={cn([
            "h-[5.25rem] rounded-lg cursor-pointer w-full flex items-center justify-center bg-secondary md:text-base text-xs font-semibold transition-all",
            isSelected && "bg-[#e9376b] text-white shadow-md font-bold",
            !isSelected && hasWatchedEpisode && "bg-slate-900 text-gray-400",
          ])}
        >
          {`Episode ${props.episode.number}`}
        </div>
      </Link>
    );
  } else {
    return (
      <Link
        href={`${ROUTES.WATCH}?anime=${props.animeId}&ep=${props.episode.number}`}
      >
        <div
          className={cn([
            "flex gap-3 items-center justify-between w-full h-fit rounded-lg p-2.5 transition-all cursor-pointer text-xs md:text-sm font-medium",
            isSelected
              ? "bg-[#e9376b] text-white font-bold shadow-md ring-1 ring-[#e9376b]/50"
              : hasWatchedEpisode
                ? "bg-slate-900/80 text-gray-400 hover:bg-slate-800"
                : "bg-secondary/40 text-gray-300 hover:bg-secondary/70 hover:text-white",
          ])}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">{`Episode ${props.episode.number}`}</span>
            {props.episode.title && props.episode.title !== `Episode ${props.episode.number}` && (
              <span className="text-xs opacity-75 line-clamp-1 font-normal">
                - {props.episode.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(props.episode.hasSub ?? (props.subOrDub && props.episode.number <= props.subOrDub.sub)) && (
              <Captions className={`h-4 w-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
            )}
            {(props.episode.hasDub ?? (props.subOrDub && props.episode.number <= props.subOrDub.dub)) && (
              <Mic className={`h-4 w-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
            )}
          </div>
        </div>
      </Link>
    );
  }
};

export default EpisodeCard;
