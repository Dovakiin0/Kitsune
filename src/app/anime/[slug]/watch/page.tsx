import { TAnimeInfo, TEpisodeInfo } from "@/@types/AnimeType";
import KitsuneVideo from "@/components/KitsuneVideo";
import useAnime from "@/hooks/useAnime";
import React from "react";
import { FaBackward, FaForward } from "react-icons/fa";

async function page({ params, searchParams }: any) {
  const { getInfo, getEpisode } = useAnime();
  const animeInfo: TAnimeInfo = await getInfo(params.slug);
  const episodeInfo: TEpisodeInfo = await getEpisode(
    animeInfo.episodes[0].id,
    "vidstreaming"
  );

  let episode = searchParams.ep;
  if (!episode) {
    episode = 1;
  }

  let quality = "1080p";

  return (
    <div className="flex lg:flex-row flex-col">
      {/*Episode Panel*/}
      <div className="flex-1 pl-5 pr-5">
        <div className="flex-col">
          <KitsuneVideo src={episodeInfo.sources[0].url} />

          <div className="flex justify-between items-center p-5">
            <FaBackward size={25} />
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-400">
              {animeInfo.title} | Episode: {searchParams.ep}
            </p>
            <FaForward size={25} />
          </div>
        </div>
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
              className="rounded-lg object-cover"
            />
            <div className="flex-col">
              <p className="font-bold text-xl">{animeInfo.title}</p>
              <p>{animeInfo.otherName}</p>
              <div>
                Genre:
                {animeInfo.genres.map((genre: string, index: number) => (
                  <div
                    className="badge badge-primary mr-1 ml-1 text-primary-content"
                    key={index}
                  >
                    {genre}
                  </div>
                ))}
              </div>
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
