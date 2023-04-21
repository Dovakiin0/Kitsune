import React from "react";

function page({ params }: any) {
  return <div>{params.animeSlug}</div>;
}

export default page;
