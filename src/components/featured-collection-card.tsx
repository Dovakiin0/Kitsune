import React from "react";
import AnimeCard from "./anime-card";
import { IAnime } from "@/types/anime";

type Props = {
  title: string;
  anime: IAnime[];
};

const FeaturedCollectionCard = (props: Props) => {
  return (
    <div className="max-w-[30rem] h-[18.5rem] flex flex-col gap-2 items-center rounded-lg overflow-hidden bg-[#212121]">
      <h5 className="text-lg font-semibold pt-5 text-center">{props.title}</h5>
      <div className="w-full relative grow flex">
        <AnimeCard
          className="absolute bottom-[-5.25rem] left-[15%] rotate-[-10deg] h-[12.5rem] w-[9.375rem] border-[.50rem] border-[#212121]"
          anime={props.anime[0] as IAnime}
        />
        <AnimeCard
          className="absolute bottom-[-6.25rem] left-[35%] h-[12.5rem] w-[9.375rem] border-[.50rem] border-[#212121]"
          anime={props.anime[1]}
        />
        <AnimeCard
          className="absolute bottom-[-7.25rem] left-[50%] rotate-[10deg] h-[12.5rem] w-[9.375rem] border-[.50rem] border-[#212121]"
          anime={props.anime[2]}
        />
      </div>
    </div>
  );
};

export default FeaturedCollectionCard;

