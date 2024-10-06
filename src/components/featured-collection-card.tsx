import React from "react";
import AnimeCard from "./anime-card";

type Props = {
  title: string;
};

const FeaturedCollectionCard = (props: Props) => {
  return (
    <div className="min-w-[21.875rem] w-[25rem] h-[16.5rem] flex flex-col gap-2 items-center rounded-lg overflow-hidden bg-[#212121]">
      <h5 className="text-lg font-semibold pt-10 w-[14ch] break-words text-center">
        {props.title}
      </h5>
      <div className="w-full relative grow flex">
        <AnimeCard className="absolute bottom-[-3.25rem] left-10 rotate-[-10deg] h-[12.5rem] w-[9.375rem] border-[.50rem] border-[#212121]" />
        <AnimeCard className="absolute bottom-[-4.25rem] left-28  h-[12.5rem] w-[9.375rem] border-[.50rem] border-[#212121]" />

        <AnimeCard className="absolute bottom-[-6.25rem] left-44 rotate-[10deg] h-[12.5rem] w-[9.375rem] border-[.50rem] border-[#212121]" />
      </div>
    </div>
  );
};

export default FeaturedCollectionCard;

