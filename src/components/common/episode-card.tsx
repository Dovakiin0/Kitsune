"use client";

import React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Episode } from "@/types/anime-details";
import { usePathname } from "next/navigation";

type Props = {
  className?: string;
  episode: Episode;
  showCard?: boolean;
  animeId: string;
  variant?: "card" | "list";
};

const EpisodeCard = ({
  showCard = false,
  variant = "card",
  ...props
}: Props) => {
  const pathName = usePathname();
  console.log(pathName);

  if (showCard && variant === "card") {
    return (
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer ",

          "h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem]",
          props.className,
        ])}
      >
        <Image
          src={props.episode.image}
          alt="image"
          height={100}
          width={100}
          className="w-full h-full object-cover"
          unoptimized
        />

        <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
        <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3">
          <h5 className="line-clamp-2">{props.episode.title}</h5>
          <p className="line-clamp-2">{props.episode.airDate}</p>
        </div>
      </div>
    );
  } else if (!showCard && variant === "card") {
    return (
      <Link href={ROUTES.WATCH + "/" + props.animeId + "/" + props.episode.id}>
        <div className="h-[6.25rem] rounded-2xl cursor-pointer w-full flex items-center justify-center bg-secondary">
          {props.episode.title}
        </div>
      </Link>
    );
  } else {
    return (
      <Link href={ROUTES.WATCH + "/" + props.animeId + "/" + props.episode.id}>
        <div
          className="flex gap-5 items-center w-full relative h-fit rounded-md p-2 "
          style={
            pathName.split("/")[pathName.split("/").length - 1] ===
            props.episode.id
              ? { backgroundColor: "#18181a" }
              : {}
          }
        >
          <figure className="h-[3.125rem] w-[4.375rem] rounded-md overflow-hidden">
            <Image
              src={props.episode.image}
              alt={props.episode.title}
              height={100}
              width={150}
              unoptimized
              className="h-full w-full object-cover"
            />
          </figure>
          <h3>{props.episode.title}</h3>
          {pathName.split("/")[pathName.split("/").length - 1] ===
            props.episode.id && (
            <span className="absolute bottom-2 right-3 text-xs font-thin">
              Now Playing
            </span>
          )}
        </div>
      </Link>
    );
  }
};

export default EpisodeCard;

