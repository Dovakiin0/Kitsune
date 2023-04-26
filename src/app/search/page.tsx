import React from "react";
import { redirect } from "next/navigation";
import useAnime from "@/hooks/useAnime";
import { TSearchAnime } from "@/@types/AnimeType";
import AnimeCard from "@/components/AnimeCard";

async function page({ searchParams }: any) {
  const { getSearch } = useAnime();

  if (!searchParams.q) {
    redirect("/");
  }

  const animeInfo: {
    results: TSearchAnime[];
  } = await getSearch(searchParams.q);

  return (
    <div className="m-2 lg:m-10 flex flex-col items-center">
      <p className="text-2xl lg:text-3xl mt-10">
        Search Result for{" "}
        <span className="font-extrabold">{searchParams.q}</span>
      </p>
      <div className="mt-10 grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 xl:gap-6 gap-3">
        {animeInfo.results.map((anime: TSearchAnime, index: number) => (
          <AnimeCard
            id={anime.id}
            key={index}
            title={
              anime.title !== ""
                ? anime.title
                : anime.id.split("-").join(" ").toString()
            }
            src={anime.image}
            additional={
              anime.releaseDate + " | " + anime.subOrDub.toUpperCase() ?? ""
            }
          />
        ))}
      </div>
    </div>
  );
}

export default page;
