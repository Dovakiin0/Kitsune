import {
  TAnimeInfo,
  TEpisodeInfo,
  TAnimeInfoEpisode,
} from "@/@types/AnimeType";
import { IKitsuEpisode, IKitsuEpisodeCore } from "@/@types/KitsuAnime";
import KitsunePlayer from "@/components/KitsunePlayer";
import useAnime from "@/hooks/useAnime";
import useKitsu from "@/hooks/useKitsu";
import Link from "next/link";
import React from "react";
import { FaBackward, FaForward } from "react-icons/fa";
import EpisodeDisplay from "./components/EpisodeDisplay";
import EpisodeLayout from "./partial/EpisodeLayout";

async function page({ params, searchParams }: any) {
  const { getInfo, getEpisode } = useAnime();
  const { getKitsuMapping } = useKitsu();
  let animeInfo: TAnimeInfo = await getInfo(params.slug);
  const kitsuMapping: IKitsuEpisode = await getKitsuMapping(params.slug);

  let episode: TAnimeInfoEpisode = searchParams.ep
    ? animeInfo.episodes.filter(
      (ep: TAnimeInfoEpisode) => ep.id === searchParams.ep
    )[0]
    : animeInfo.episodes[0];

  const episodeInfo: TEpisodeInfo = await getEpisode(
    episode.id,
    "vidstreaming"
  );

  if (typeof kitsuMapping !== "undefined") {
    kitsuMapping.data.map((kitsu: IKitsuEpisodeCore, index: number) => {
      if (kitsu.attributes.airdate) {
        animeInfo.episodes[index].kitsu = kitsu;
      }
    });
  }
  return (
    <div className="flex lg:flex-row flex-col h-full">
      {/*Episode Panel*/}
      <div className="flex-1 lg:pl-5 lg:pr-5">
        <div className="flex-col">
          <KitsunePlayer
            episodeInfo={episodeInfo}
            animeInfo={animeInfo}
            thumb={episode.kitsu?.attributes.thumbnail.original}
          />

          <div className="flex justify-between items-center lg:p-5 p-2 gap-5">
            <FaBackward size={25} className="hover:text-primary" />
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-400">
              {animeInfo.title} | Episode: {episode.number}
            </p>

            <FaForward size={25} className="hover:text-primary" />
          </div>
          <EpisodeLayout animeInfo={animeInfo} episode={episode} />
        </div>
      </div>
      {/*Information Panel*/}
      <div className="relative lg:right-0 lg:w-1/4">
        <div
          className={`rounded-lg p-5 h-[90vh] lg:h-full w-full`}
          style={{
            backgroundImage: `url(${animeInfo.image})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            filter: "blur(20px)",
            WebkitFilter: "blur(20px)",
          }}
        ></div>
        <div
          className={`rounded-lg absolute top-0 p-5 h-[90vh] lg:h-full w-full bg-gray-700 opacity-20`}
        ></div>
        <div className="absolute top-0 m-5 flex flex-col gap-5">
          <div className="flex lg:flex-row flex-col gap-3">
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
            <div className="max-h-[40vh] overflow-y-auto">
              {animeInfo.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
