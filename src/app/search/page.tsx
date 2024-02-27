"use client";
import React from "react";
import { redirect, useSearchParams } from "next/navigation";
import useAnime from "@/hooks/useAnime";
import AnimeCard from "@/components/AnimeCard";
import { ISearchAnime } from "@/@types/AnimeType";
import Loading from "../loading";

async function page() {
  const query = useSearchParams();
  const { getSearch } = useAnime();

  if (!query.get("q")) {
    redirect("/");
  }

  const animeInfo: ISearchAnime[] = await getSearch(query.get("q")!);

  return animeInfo ? (
    <div className="m-2 lg:m-10 flex flex-col items-center">
      <p className="text-2xl lg:text-3xl mt-20">
        Search Result for{" "}
        <span className="font-extrabold">{query.get("q")}</span>
      </p>
      <div className="container mx-auto gap-10 w-full mt-10 flex flex-wrap justify-between lg:justify-start">
        {animeInfo.map((anime: ISearchAnime, index: number) => (
          <AnimeCard
            id={anime.id}
            key={index}
            title={anime.title}
            src={anime.image}
            additional={`${anime.subOrDub}`}
          />
        ))}
      </div>
    </div>
  ) : (
    <Loading />
  );
}

export default page;
