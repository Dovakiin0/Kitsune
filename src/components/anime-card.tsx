import React from "react";
import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { IAnime } from "@/types/anime";
import { ROUTES } from "@/constants/routes";

import { IAnimeDetails } from "@/types/anime-details";

type Props = {
  className?: string;
  anime: IAnime | IAnimeDetails;
  displayDetails?: boolean;
  variant?: "sm" | "lg";
  href?: string;
};

function isAnime(anime: IAnime | IAnimeDetails): anime is IAnime {
  return (anime as IAnime).episodeTitle !== undefined;
}

const AnimeCard = ({
  displayDetails = true,
  variant = "sm",
  ...props
}: Props) => {
  return (
    <Link href={props.href || `${ROUTES.ANIME_DETAILS}/${props.anime.id}`}>
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer ",
          variant === "sm" &&
            "h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem]",
          ,
          variant === "lg" &&
            "max-w-[12.625rem] md:max-w-[18.75rem] h-auto md:h-[25rem]",
          props.className,
        ])}
      >
        <Image
          src={props.anime.image}
          alt="image"
          height={100}
          width={100}
          className="w-full h-full object-cover"
          unoptimized
        />
        {displayDetails && (
          <>
            <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
            <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3">
              <h5 className="line-clamp-2">
                {!!props.anime.title.english
                  ? props.anime.title.english
                  : props.anime.title.userPreferred}
              </h5>
              {isAnime(props.anime) ? (
                <p className="line-clamp-2">{props.anime.episodeTitle}</p>
              ) : (
                props.anime.releaseDate && (
                  <p className="line-clamp-2">
                    {props.anime.releaseDate}, {props.anime.genres?.join(", ")}
                  </p>
                )
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;

