import React from "react";
import Image from "next/image";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { IAnimeDetails } from "@/types/anime-details";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

import WatchButton from "@/components/watch-button";
import { IAnime } from "@/types/anime";
import AnimeCarousel from "@/components/anime-carousel";
import AnimeEpisodes from "@/components/anime-episodes";
import CharacterCard from "@/components/common/character-card";
import { ROUTES } from "@/constants/routes";
import WatchTrailer from "@/components/watch-trailer";

const Page = async ({ params }: { params: { slug: string } }) => {
  const anime: IAnimeDetails = await api
    .get(`/anime/${params.slug}`)
    .then((res) => {
      return res.data.data;
    });

  return (
    <div className="w-full z-50">
      <div className="h-[30vh] md:h-[40vh] w-full relative ">
        <Image
          src={anime.anime.info.poster}
          alt={anime.anime.info.name}
          height={100}
          width={100}
          className="h-full w-full object-cover"
          unoptimized
        />
        <WatchTrailer
          videoHref={anime.anime.info.promotionalVideos[0]?.source}
        />
        <div className="absolute h-full w-full inset-0 m-auto bg-gradient-to-r from-slate-900 to-transparent"></div>
      </div>
      <Container className="z-50 md:space-y-10 pb-20">
        <div className="flex md:mt-[-9.375rem] mt-[-6.25rem] md:flex-row flex-col md:items-end md:gap-20 gap-10 ">
          <AnimeCard
            title={anime.anime.info.name}
            poster={anime.anime.info.poster}
            href={`${ROUTES.ANIME_DETAILS}/${anime.anime.info.id}`}
            displayDetails={false}
            variant="lg"
            className="shrink-0"
          />
          <div className="flex flex-col md:gap-5 gap-2 pb-16">
            <h1 className="md:text-5xl text-2xl md:font-black font-extrabold z-[9]">
              {anime.anime.info.name}
            </h1>

            <WatchButton />
          </div>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex items-center justify-start w-fit text-2xl h-fit">
            <TabsTrigger
              value="overview"
              className="md:text-2xl text-lg font-semibold"
            >
              Overview
            </TabsTrigger>

            <TabsTrigger
              value="episodes"
              className="md:text-2xl text-lg font-semibold"
            >
              Episodes
            </TabsTrigger>
            {anime.anime.info.charactersVoiceActors.length > 0 && (
              <TabsTrigger
                value="characters"
                className="md:text-2xl text-lg font-semibold"
              >
                Characters
              </TabsTrigger>
            )}
            {anime.seasons.length > 0 && (
              <TabsTrigger
                value="relations"
                className="md:text-2xl text-lg font-semibold"
              >
                Relations
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="overview"
            className="w-full grid md:grid-cols-5 grid-cols-1 gap-x-20 gap-y-5 mt-10"
          >
            <div className="col-span-1 flex flex-col gap-5 w-full">
              <h3 className="text-xl font-semibold">Details</h3>
              <div className="grid grid-cols-2 w-full md:text-base text-xs gap-y-2 gap-x-20 md:gap-x-0">
                <h3>Aired</h3>
                <span>{anime.anime.moreInfo.aired}</span>

                <h3>Rating</h3>
                <span>{anime.anime.info.stats.rating}</span>

                <h3>Genres</h3>
                <span>{anime.anime.moreInfo.genres.join(", ")}</span>

                <h3>Type</h3>
                <span>{anime.anime.info.stats.type}</span>

                <h3>Status</h3>
                <span>{anime.anime.moreInfo.status}</span>

                <h3>Season</h3>
                <span className="capitalize">{}</span>

                <h3>Studios</h3>
                <span>{anime.anime.moreInfo.studios}</span>
              </div>
            </div>
            <div className="col-span-4 flex flex-col gap-5">
              <h3 className="text-xl font-semibold">Description</h3>
              <p className="md:text-base text-xs leading-6">
                {anime.anime.info.description}
              </p>
            </div>
          </TabsContent>

          <TabsContent
            value="relations"
            className="w-full flex flex-col gap-5 "
          >
            <h3 className="text-xl font-semibold">Relations</h3>
            <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
              {anime.seasons.map((relation, idx) => {
                return (
                  !relation.isCurrent && (
                    <AnimeCard
                      key={idx}
                      title={relation.name}
                      subTitle={relation.title}
                      poster={relation.poster}
                      className="self-center justify-self-center"
                      href={`${ROUTES.ANIME_DETAILS}/${relation.id}`}
                    />
                  )
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="episodes" className="flex flex-col gap-5">
            <AnimeEpisodes animeId={anime.anime.info.id} />
          </TabsContent>
          {!!anime.anime.info.charactersVoiceActors.length && (
            <TabsContent
              value="characters"
              className="w-full flex flex-col gap-5 "
            >
              <h3 className="text-xl font-semibold">Anime Characters</h3>
              <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
                {anime.anime.info.charactersVoiceActors.map(
                  (character, idx) => {
                    return (
                      <CharacterCard
                        key={idx}
                        character={character}
                        className="self-center justify-self-center"
                      />
                    );
                  },
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {!!anime.recommendedAnimes.length && (
          <AnimeCarousel
            anime={anime.recommendedAnimes as IAnime[]}
            title="Recommended"
            className="pt-20"
          />
        )}
      </Container>
    </div>
  );
  //eslint-disable-next-line
};

export default Page;
