import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import useBookMarks from "@/hooks/use-get-bookmark";
import React from "react";

type Props = {
  status: string;
};

function AnimeLists(props: Props) {
  const { bookmarks } = useBookMarks({
    status: props.status,
    page: 1,
    per_page: 8,
  });

  return (
    bookmarks && (
      <div className="grid grid-cols-4 gap-6 mt-10">
        {bookmarks.map((bookmark) => {
          const latestEpisode = bookmark.expand.watchHistory.sort(
            (a, b) => b.episodeNumber - a.episodeNumber,
          )[0];

          return (
            <AnimeCard
              key={bookmark.id}
              displayDetails={true}
              poster={bookmark.thumbnail}
              title={bookmark.animeTitle}
              href={`${ROUTES.WATCH}?anime=${bookmark.animeId}&episode=${latestEpisode.episodeId}`}
              watchDetail={latestEpisode}
            />
          );
        })}
      </div>
    )
  );
}

export default AnimeLists;
