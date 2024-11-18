import React from "react";
import AnimeCard from "./anime-card";
import { IAnime } from "@/types/anime";
import { ROUTES } from "@/constants/routes";

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
          title={props.anime[0].name}
          className="absolute md:bottom-[-5.25rem] bottom-[-4.25rem] left-[15%] rotate-[-10deg] w-[9.375rem] border-[.50rem] border-[#212121]"
          subTitle={props.anime[0].episodes.sub?.toString()}
          poster={props.anime[0].poster}
          href={`${ROUTES.ANIME_DETAILS}/${props.anime[0].id}`}
        />
        <AnimeCard
          title={props.anime[1].name}
          className="absolute md:bottom-[-6.25rem] bottom-[-5rem] left-[35%]  w-[9.375rem] border-[.50rem] border-[#212121]"
          subTitle={props.anime[1].episodes.sub?.toString()}
          poster={props.anime[1].poster}
          href={`${ROUTES.ANIME_DETAILS}/${props.anime[1].id}`}
        />{" "}
        <AnimeCard
          title={props.anime[2].name}
          className="absolute md:bottom-[-7.25rem] bottom-[-6rem] left-[50%] rotate-[10deg]  w-[9.375rem] border-[.50rem] border-[#212121]"
          subTitle={props.anime[2].episodes.sub?.toString()}
          poster={props.anime[2].poster}
          href={`${ROUTES.ANIME_DETAILS}/${props.anime[2].id}`}
        />
      </div>
    </div>
  );
};

export default FeaturedCollectionCard;
