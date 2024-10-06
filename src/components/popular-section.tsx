import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import { Button } from "./ui/button";

const PopularSection = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
      <h5 className="text-2xl font-bold">Most Popular</h5>
      <div className="flex items-center lg:justify-between justify-evenly flex-wrap gap-y-5 w-full gap-5">
        {Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12).map((anime, idx) => (
          <AnimeCard key={idx} />
        ))}
      </div>
      <Button className="w-full text-md py-6 font-semibold">Show More</Button>
    </Container>
  );
};

export default PopularSection;

