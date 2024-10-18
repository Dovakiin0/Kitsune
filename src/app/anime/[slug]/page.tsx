import React from "react";
import Image from "next/image";
import parse from "html-react-parser";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { IAnimeDetails } from "@/types/anime-details";

import Button from "@/components/common/custom-button";
import { IAnimeResponse } from "@/types/anime-api-response";
import { CirclePlay, EyeIcon, Sparkles } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CharacterCard from "@/components/common/character-card";
import AnimeEpisodes from "@/components/anime-episodes";
import { api } from "@/lib/api";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const anime: IAnimeResponse = await api.get("/anime/recent").then((res) => {
      return res.data;
    });
    return anime.results.map((anime) => ({
      slug: String(anime.id),
    }));
  } catch (error) {
    console.error("Error fetching anime data:", error);
    return [];
  }
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const anime: IAnimeDetails = await api
    .get(`/anime/${params.slug}`)
    .then((res) => {
      return res.data;
    });

  return (
    <div className="w-full z-50">
      <div className="h-[30vh] md:h-[40vh] w-full relative ">
        <Image
          src={anime.cover}
          alt={anime.title.english}
          height={100}
          width={100}
          className="h-full w-full object-cover"
          unoptimized
        />
        <Button
          className="absolute md:flex hidden md:bottom-10 md:right-10 bottom-4 right-4 m-auto z-10"
          LeftIcon={CirclePlay}
        >
          Watch Trailer
        </Button>
        <div className="absolute h-full w-full inset-0 m-auto bg-gradient-to-r from-slate-900 to-transparent"></div>
      </div>
      <Container className="z-50 md:space-y-10 pb-20">
        <div className="flex md:mt-[-9.375rem] mt-[-6.25rem] md:flex-row flex-col md:items-end md:gap-20 gap-10 ">
          <AnimeCard anime={anime} displayDetails={false} variant="lg" />
          <div className="flex flex-col md:gap-5 gap-2 pb-16">
            <h1 className="md:text-5xl text-2xl md:font-black font-extrabold">
              {!!anime.title.english ? anime.title.english : anime.title.romaji}
            </h1>
            <div className="flex items-center gap-2">
              <Sparkles />
              <h4 className="md:text-2xl text-lg font-bold">
                {anime.rating / 10}
              </h4>
            </div>
            <Button className="max-w-fit mt-5" LeftIcon={EyeIcon}>
              Start Watching
            </Button>
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

            <TabsTrigger
              value="relations"
              className="md:text-2xl text-lg font-semibold"
            >
              Relations
            </TabsTrigger>

            <TabsTrigger
              value="characters"
              className="md:text-2xl text-lg font-semibold"
            >
              Characters
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="overview"
            className="w-full grid md:grid-cols-5 grid-cols-1 gap-x-20 gap-y-5 md:mt-10 mt-5"
          >
            <div className="col-span-1 flex flex-col gap-5 w-full">
              <h3 className="text-xl font-semibold">Details</h3>
              <div className="grid grid-cols-2 w-full md:text-lg text-base gap-y-2 gap-x-20 md:gap-x-0">
                <h3>Type</h3>
                <span>{anime.type}</span>

                <h3>Episodes</h3>
                <span>{anime.totalEpisodes}</span>

                <h3>Genres</h3>
                <span>{anime.genres.join(", ")}</span>

                <h3>Aired</h3>
                <span>
                  {anime.startDate.day +
                    "/" +
                    anime.startDate.month +
                    "/" +
                    anime.startDate.year}
                </span>

                <h3>Status</h3>
                <span>{anime.status}</span>

                <h3>Season</h3>
                <span className="capitalize">{anime.season}</span>

                <h3>Studios</h3>
                <span>{anime.studios}</span>
              </div>
            </div>
            <div className="col-span-4 flex flex-col gap-5">
              <h3 className="text-xl font-semibold">Description</h3>
              <p className="md:text-lg text-base">
                {parse(anime?.description as string)}
              </p>
            </div>
          </TabsContent>

          <TabsContent
            value="episodes"
            className="flex flex-col md:mt-10 mt-5 gap-5"
          >
            <AnimeEpisodes episodes={anime.episodes} animeId={anime.id} />
          </TabsContent>

          <TabsContent
            value="characters"
            className="w-full flex flex-col md:mt-10 gap-5 mt-5"
          >
            <h3 className="text-xl font-semibold">Anime Characters</h3>
            <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
              {anime.characters.map((character, idx) => {
                return (
                  <CharacterCard
                    key={idx}
                    character={character}
                    className="self-center justify-self-center"
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
  //eslint-disable-next-line
};

export default Page;

