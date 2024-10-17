import { cn } from "@/lib/utils";
import { IAnime } from "@/types/anime";
import Image from "next/image";
import React from "react";

type Props = {
  className?: string;
  anime: IAnime;
};

const AnimeCard = (props: Props) => {
  return (
    <div
      className={cn([
        " h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] rounded-xl overflow-hidden relative cursor-pointer md:h-[18.75rem] md:max-w-[12.5rem]",
        ,
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
      <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
      <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3">
        <h5 className="line-clamp-2">{props.anime.title.english}</h5>
        <p className="line-clamp-2">
          {props.anime.releaseDate}, {props.anime.genres?.join(", ")}
        </p>
      </div>
    </div>
  );
};

export default AnimeCard;

