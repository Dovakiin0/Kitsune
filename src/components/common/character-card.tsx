import React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

import { CharactersVoiceActor } from "@/types/anime-details";

type Props = {
  className?: string;
  character: CharactersVoiceActor;
};

const CharacterCard = ({ ...props }: Props) => {
  return (
    <div
      className={cn([
        "rounded-xl overflow-hidden relative cursor-pointer ",

        "h-[15.625rem] min-w-[10.625rem] max-w-[12.625rem] md:h-[18.75rem] md:max-w-[12.5rem]",
        props.className,
      ])}
    >
      <Image
        src={props.character.character.poster}
        alt="image"
        height={100}
        width={100}
        className="w-full h-full object-cover"
        unoptimized
      />

      <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
      <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3">
        <h5 className="line-clamp-2">{props.character.character.name}</h5>
        <p className="line-clamp-2">{props.character.character.cast}</p>
      </div>
    </div>
  );
};

export default CharacterCard;
