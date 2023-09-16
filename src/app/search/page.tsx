import React from "react";
import { redirect } from "next/navigation";
import useAnime from "@/hooks/useAnime";
import AnimeCard from "@/components/AnimeCard";
import { ISearchAnime } from "@/@types/AnimeType";

async function page({ searchParams }: any) {
  const { getSearch } = useAnime();

  if (!searchParams.q) {
    redirect("/");
  }

  // const animeInfo: {
  //   data: ISearchAnime[];
  // } = await getSearch(searchParams.q);
  //
  return (
    <div className="m-2 lg:m-10 flex flex-col items-center">
      {/* <p className="text-2xl lg:text-3xl mt-20"> */}
      {/*   Search Result for{" "} */}
      {/*   <span className="font-extrabold">{searchParams.q}</span> */}
      {/* </p> */}
      {/* <div className="mt-10 flex flex-wrap justify-between lg:justify-start xl:gap-8 lg:gap-6 gap-3"> */}
      {/*   {animeInfo.data.map((anime: ISearchAnime, index: number) => ( */}
      {/*     <AnimeCard */}
      {/*       id={anime.id} */}
      {/*       key={index} */}
      {/*       title={anime.title} */}
      {/*       src={anime.image} */}
      {/*       additional={`${anime.subOrDub}`} */}
      {/*     /> */}
      {/*   ))} */}
      {/* </div> */}
      Under Maintenance
    </div>
  );
}

export default page;
