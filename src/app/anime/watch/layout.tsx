"use client";

import Loading from "@/app/loading";
import EpisodeCard from "@/components/common/episode-card";
import Container from "@/components/container";
import { useGetAnimeDetails } from "@/query/get-anime-details";
import { useAnimeStore } from "@/store/anime-store";
import { useSearchParams } from "next/navigation";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  children: ReactNode;
};

const Layout = (props: Props) => {
  const searchParams = useSearchParams();
  const { setAnime, setSelectedEpisode } = useAnimeStore();

  const currentAnimeId = useMemo(
    () => searchParams.get("anime"),
    [searchParams]
  );
  const episodeId = searchParams.get("episode");

  const [animeId, setAnimeId] = useState<string | null>(currentAnimeId);

  useEffect(() => {
    if (currentAnimeId !== animeId) {
      setAnimeId(currentAnimeId);
    }

    if (episodeId) {
      setSelectedEpisode(episodeId);
    }
  }, [currentAnimeId, episodeId, animeId, setSelectedEpisode]);

  const { data: anime, isLoading } = useGetAnimeDetails(animeId as string);

  useEffect(() => {
    if (anime) {
      setAnime(anime);
    }
  }, [anime, setAnime]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const episodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const episodeIndex = anime?.episodes.findIndex(
      (episode) => episode.id === episodeId
    );

    if (
      episodeIndex !== undefined &&
      episodeIndex >= 0 &&
      episodeRefs.current[episodeIndex]
    ) {
      const episodeElement = episodeRefs.current[episodeIndex];
      const scrollContainer = scrollContainerRef.current;

      if (episodeElement && scrollContainer) {
        // Get the top offset of the episode relative to the scroll container
        const episodeOffsetTop = episodeElement.offsetTop;

        // Scroll the container directly to the episode's top position
        scrollContainer.scrollTop =
          episodeOffsetTop -
          scrollContainer.offsetHeight / 2 +
          episodeElement.offsetHeight / 2 +
          80; //Adding some extra px to achieve better positioning
      }
    }
    //eslint-disable-next-line
  }, [anime]);

  if (isLoading) return <Loading />;

  return (
    <Container className="mt-[6.5rem]">
      <div className="grid md:grid-cols-4 grid-cols-1 gap-y-5 gap-x-10 w-full">
        <div className="md:col-span-3 col-span-1">{props.children}</div>
        <div className="col-span-1 flex flex-col w-full gap-5 border-[.0313rem] border-secondary rounded-md overflow-hidden lg:max-h-[80vh] max-h-[40vh] h-fit">
          <div className="h-fit bg-[#18181a] px-5 py-3">
            <h3 className="text-lg font-semibold"> Episode Playlist</h3>
            <span className="text-sm font-thin">{anime?.title.english}</span>
          </div>
          <div
            ref={scrollContainerRef}
            className="flex flex-col gap-1 px-2 pb-3 flex-grow overflow-y-auto"
          >
            {anime?.episodes.map((episode, idx) => (
              //@ts-expect-error type mismatch
              <div key={idx} ref={(el) => (episodeRefs.current[idx] = el)}>
                <EpisodeCard
                  variant="list"
                  episode={episode}
                  animeId={anime.id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Layout;

