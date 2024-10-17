"use client";

import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import { Button } from "./ui/button";
import { useGetPopularAnime } from "@/query/get-popular-anime";

const PopularSection = () => {
  const { data, isLoading } = useGetPopularAnime();
  if (isLoading) return <>Loading</>;
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
      <h5 className="text-2xl font-bold">Most Popular</h5>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {data?.results.map((anime, idx) => (
          <AnimeCard
            key={idx}
            anime={anime}
            className="self-center justify-self-center"
          />
        ))}
      </div>
      <Button className="w-full text-md py-6 font-semibold">Show More</Button>
    </Container>
  );
};

export default PopularSection;

