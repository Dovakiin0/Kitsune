import React from "react";
import Container from "./container";
// import FeaturedCollectionCard from "./featured-collection-card";

// const featuredTitle = [
//   "The Best Mystical Anime",
//   "Top 20 Romance Anime",
//   "The Best Classic Anime",
// ];

const FeaturedCollection = () => {
  return (
    <Container className="flex flex-col gap-5 items-center lg:items-start py-5">
      <h5 className="text-2xl font-bold">Featured Collection</h5>
      <div className="flex items-center flex-wrap justify-evenly gap-y-5 lg:justify-between w-full gap-5">
        {/* {featuredTitle.map((title, idx) => (
          <FeaturedCollectionCard title={title} key={idx} />
        ))} */}
      </div>
    </Container>
  );
};

export default FeaturedCollection;

