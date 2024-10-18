import React, { Suspense } from "react";
import Container from "@/components/container";
import EpisodeCard from "@/components/common/episode-card";
import Loading from "@/app/loading";
import { api } from "@/lib/api";
import { IAnimeDetails } from "@/types/anime-details";
import { IEpisodes } from "@/types/episodes";
import KitsunePlayer from "@/components/kitsune-player";

// Component to fetch data asynchronously
async function FetchAnimeAndEpisodes(animeId: string, episodeId: string) {
  const anime: IAnimeDetails = await api
    .get(`/anime/${animeId}`)
    .then((res) => res.data);
  const episodeData: IEpisodes = await api
    .get("/anime/episode/" + episodeId)
    .then((res) => res.data);
  return { anime, episodeData };
}

const Page = ({
  params: { anime, episode },
}: {
  params: { anime: string; episode: string };
}) => {
  const dataPromise = FetchAnimeAndEpisodes(anime, episode);

  return (
    <Suspense fallback={<Loading />}>
      <PageContent dataPromise={dataPromise} />
    </Suspense>
  );
};

async function PageContent({
  dataPromise,
}: {
  dataPromise: Promise<{
    anime: IAnimeDetails;
    episodeData: IEpisodes;
  }>;
}) {
  const { anime, episodeData } = await dataPromise;

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
            {anime.episodes.map((episode, idx) => (
              <EpisodeCard
                variant="list"
                episode={episode}
                key={idx}
                animeId={anime.id}
              />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

export default Page;

