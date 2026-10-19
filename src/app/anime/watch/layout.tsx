"use client";

import Loading from "@/app/loading";
import parse from "html-react-parser";
import { ROUTES } from "@/constants/routes";

import Container from "@/components/container";
import AnimeCard from "@/components/anime-card";
import { useAnimeStore } from "@/store/anime-store";

import EpisodePlaylist from "@/components/episode-playlist";
import Select, { ISelectOptions } from "@/components/common/select";
import {
  Ban,
  BookmarkCheck,
  CheckCheck,
  Hand,
  TvMinimalPlay,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAnimeDetails } from "@/query/get-anime-details";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import AnimeCarousel from "@/components/anime-carousel";
import { IAnime } from "@/types/anime";
import useBookMarks from "@/hooks/use-get-bookmark";
import { toast } from "sonner";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import CommentsSection from "@/components/comments/comments-section";

type Props = {
  children: ReactNode;
};

const Layout = (props: Props) => {
  const searchParams = useSearchParams();
  const { setAnime, setSelectedEpisode } = useAnimeStore();
  const router = useRouter();

  const currentAnimeId = useMemo(
    () => searchParams.get("anime"),
    [searchParams],
  );
  const episodeId = searchParams.get("episode");

  const epNumberParam = searchParams.get("ep");
  const currentEpNum = epNumberParam ? Number(epNumberParam) : 1;

  const [animeId, setAnimeId] = useState<string | null>(currentAnimeId);

  useEffect(() => {
    if (currentAnimeId !== animeId) {
      setAnimeId(currentAnimeId);
    }
  }, [currentAnimeId, animeId]);

  const { data: anime, isLoading } = useGetAnimeDetails(animeId as string);

  useEffect(() => {
    if (anime) {
      setAnime(anime);
    }
  }, [anime, setAnime]);

  useEffect(() => {
    if (!animeId && typeof window !== "undefined") {
      router.push(ROUTES.HOME);
    }
  }, [animeId, router]);

  const normalizeStatus = (s?: string) =>
    s ? s.toLowerCase().replace(/_/g, " ").trim() : "";

  const { bookmarks, createOrUpdateBookMark } = useBookMarks({
    animeID: currentAnimeId as string,
    page: 1,
    per_page: 1,
  });
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (bookmarks?.[0]?.status) {
      setSelected(normalizeStatus(bookmarks[0].status));
    }
  }, [bookmarks]);

  const SelectOptions: ISelectOptions[] = [
    {
      label: "Watching",
      value: "watching",
      icon: TvMinimalPlay,
    },
    {
      label: "Plan to watch",
      value: "plan to watch",
      icon: BookmarkCheck,
    },
    {
      label: "On Hold",
      value: "on hold",
      icon: Hand,
    },
    {
      label: "Completed",
      value: "completed",
      icon: CheckCheck,
    },
    {
      label: "Dropped",
      value: "dropped",
      icon: Ban,
    },
  ];

  const handleSelect = async (value: string) => {
    if (!anime?.anime.info.name || !anime?.anime.info.poster) return;
    const previousSelected = selected;
    setSelected(value);

    try {
      await createOrUpdateBookMark(
        currentAnimeId as string,
        anime?.anime.info.name!,
        anime?.anime.info.poster!,
        value,
      );
    } catch (error) {
      console.log(error);
      setSelected(previousSelected);
      toast.error("Error adding to list", { style: { background: "red" } });
    }
  };

  const { data: episodes, isLoading: episodeLoading } = useGetAllEpisodes(
    animeId as string,
  );

  // Auto-resolve episode ID if only episode number (ep) is in query or if no episode parameter exists
  useEffect(() => {
    if (episodes?.episodes?.length) {
      if (episodeId) {
        setSelectedEpisode(episodeId);
      } else {
        const epNum = epNumberParam ? Number(epNumberParam) : 1;
        const matchedEp =
          episodes.episodes.find((e) => e.number === epNum) || episodes.episodes[0];
        if (matchedEp?.episodeId) {
          setSelectedEpisode(matchedEp.episodeId);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("episode", matchedEp.episodeId);
            window.history.replaceState({}, "", url.toString());
          }
        }
      }
    }
  }, [episodes, episodeId, epNumberParam, setSelectedEpisode]);

  if (isLoading) return <Loading />;

  return (
    anime?.anime.info && (
      <Container className="mt-[6.5rem] space-y-10 pb-20">
        <div className="grid lg:grid-cols-4 grid-cols-1 gap-y-5 gap-x-10 h-auto w-full">
          <div className="lg:col-span-3 col-span-1 lg:mb-0">
            {props.children}
          </div>
          {episodes && (
            <EpisodePlaylist
              animeId={animeId as string}
              title={
                !!anime?.anime.info.name
                  ? anime.anime.info.name
                  : (anime?.anime.moreInfo.japanese as string)
              }
              subOrDub={anime?.anime.info.stats.episodes}
              episodes={episodes}
              isLoading={episodeLoading}
              bookmarks={bookmarks}
            />
          )}
        </div>
        <div className="flex md:flex-row flex-col gap-5 -mt-5">
          <AnimeCard
            title={anime?.anime.info.name}
            poster={anime?.anime.info.poster}
            subTitle={anime?.anime.moreInfo.aired}
            displayDetails={false}
            className="!h-full !rounded-sm"
            href={ROUTES.ANIME_DETAILS + "/" + anime?.anime.info.id}
          />
          <div className="flex flex-col gap-2">
            <Select
              placeholder="Add to list"
              value={selected || normalizeStatus(bookmarks?.[0]?.status)}
              options={SelectOptions}
              onChange={handleSelect}
            />
            <h1 className="text-2xl md:font-black font-extrabold z-[100]">
              {anime?.anime.info.name}
            </h1>
            <p>{parse(anime?.anime.info.description as string)}</p>
          </div>
        </div>

        {/* Community Comments Section */}
        <CommentsSection
          animeId={animeId as string}
          animeTitle={anime?.anime.info.name || "Anime"}
          episodeNumber={currentEpNum}
        />

        <AnimeCarousel
          title={"Also Watch"}
          anime={anime?.relatedAnimes as IAnime[]}
        />
        <AnimeCarousel
          title={"Recommended"}
          anime={anime?.recommendedAnimes as IAnime[]}
        />
      </Container>
    )
  );
};
export default Layout;
