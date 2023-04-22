import { TAnimeInfo } from "@/@types/AnimeType";
import useAnime from "@/hooks/useAnime";
import React from "react";

async function page({ params, searchParams }: any) {
  const { getInfo } = useAnime();
  const animeInfo: TAnimeInfo = await getInfo(params.slug);

  return (
    <div className="flex lg:flex-row flex-col">
      {/*Episode Panel*/}
      <div className="flex-1">
        {params.slug}/{searchParams.ep}
      </div>
      {/*Information Panel*/}
      <div className="relative lg:right-0 lg:w-1/4 h-[85vh]">
        <div
          className={`rounded-lg p-5 h-full w-full`}
          style={{
            backgroundImage: `url(${animeInfo.image})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            filter: "blur(20px)",
            WebkitFilter: "blur(20px)",
          }}
        ></div>
        <div
          className={`rounded-lg absolute top-0 p-5 h-full w-full bg-primary opacity-20`}
        ></div>
        <div className="absolute top-0 m-5 flex flex-col gap-5">
          <div className="flex gap-3">
            <img
              src={animeInfo.image}
              width="150"
              height="150"
              className="rounded-lg"
            />
            <div className="flex-col">
              <p className="font-bold text-xl">{animeInfo.title}</p>
              <p>{animeInfo.otherName}</p>
              <p>
                Genre:{" "}
                {animeInfo.genres.map((genre: string) => (
                  <div className="badge badge-primary mr-1 ml-1">{genre}</div>
                ))}
              </p>
              <p>Status: {animeInfo.status}</p>
              <p>Released: {animeInfo.releaseDate}</p>
              <p>Episodes: {animeInfo.totalEpisodes}</p>
            </div>
          </div>
          <div>
            <div className="max-h-[60vh] overflow-y-auto">
              {animeInfo.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
