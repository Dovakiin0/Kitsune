import React from "react";
import { api } from "@/lib/api";
import Container from "@/components/container";
import { IAnimeDetails } from "@/types/anime-details";
import { IEpisodes } from "@/types/episodes";
import KitsunePlayer from "@/components/kitsune-player";
import EpisodeCard from "@/components/common/episode-card";

type Props = {
  params: {
    episode: string;
    anime: string;
  };
};

const page = async (props: Props) => {
  try {
    const anime: IAnimeDetails = await api
      .get(`/anime/${props.params.anime}`)
      .then((res) => {
        return res.data;
      });
    const episodeData: IEpisodes = await api
      .get("/anime/episode/" + props.params.episode)
      .then((res) => res.data);

    return (
      <Container className="mt-[6.5rem]">
        <div className="grid md:grid-cols-4 grid-cols-1 gap-y-5 gap-x-10 w-full">
          <div className="md:col-span-3 col-span-1">
            <KitsunePlayer episodeInfo={episodeData} animeInfo={anime} />
          </div>
          <div className="col-span-1 flex flex-col w-full gap-5 border-[.0313rem] border-secondary  rounded-md overflow-hidden h-[80vh] ">
            <div className="h-fit bg-[#18181a] px-5 py-3 ">
              <h3 className="text-lg font-semibold"> Episode Playlist</h3>
              <span className="text-sm font-thin">{anime.title.english}</span>
            </div>
            <div className="flex flex-col gap-1 px-2 pb-3 flex-grow overflow-y-auto ">
              {anime.episodes.map((episode, idx) => {
                return (
                  <EpisodeCard
                    variant="list"
                    episode={episode}
                    key={idx}
                    animeId={anime.id}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    );
  } catch (error) {
    console.error("Error fetching anime details:", error);
    return <div className="h-20vh w-full"></div>;
  }
};

export default page;

