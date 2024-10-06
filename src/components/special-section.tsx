import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";

const SpecialSection = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start lg:mt-[-8.125rem] ">
      <h5 className="text-2xl font-bold">Special For You</h5>
      <div className="flex items-center lg:justify-between justify-evenly flex-wrap gap-y-5 w-full gap-5">
        {Array.of(1, 2, 3, 4, 5, 6).map((anime, idx) => (
          <AnimeCard key={idx} />
        ))}
      </div>
    </Container>
  );
};

export default SpecialSection;

