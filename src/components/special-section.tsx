"use client";

import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import { useGetRecentAnime } from "@/query/get-recent-anime";

const SpecialSection = () => {
  const { data, isLoading } = useGetRecentAnime();
  if (isLoading) return <>Loading</>;
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start lg:mt-[-8.125rem] z-20 ">
      <h5 className="text-2xl font-bold">Recent Releases</h5>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {data?.results.map((anime, idx) => (
          <AnimeCard
            anime={anime}
            key={idx}
            className="self-center justify-self-center"
          />
        ))}
      </div>
    </Container>
  );
};

export default SpecialSection;

