import AnimeCard from "@/components/anime-card";
import Pagination from "@/components/common/pagination";
import { ROUTES } from "@/constants/routes";
import useBookMarks from "@/hooks/use-get-bookmark";
import React from "react";

type Props = {
  status: string;
};

function AnimeLists(props: Props) {
  const [currentPage, setPage] = React.useState(1);

  const { bookmarks, totalPages, isLoading } = useBookMarks({
    status: props.status,
    page: currentPage,
    per_page: 8,
  });

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setPage((prevPage) => prevPage - 1);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setPage(pageNumber);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return bookmarks && bookmarks.length > 0 ? (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
        {bookmarks.map((bookmark) => {
          const latestEpisode = bookmark.expand.watchHistory
            ? bookmark.expand.watchHistory.sort(
                (a, b) => b.episodeNumber - a.episodeNumber,
              )[0]
            : null;

          const url = latestEpisode
            ? `${ROUTES.WATCH}?anime=${bookmark.animeId}&episode=${latestEpisode.episodeId}`
            : `${ROUTES.ANIME_DETAILS}/${bookmark.animeId}`;

          return (
            <AnimeCard
              key={bookmark.id}
              displayDetails={true}
              poster={bookmark.thumbnail}
              title={bookmark.animeTitle}
              href={`${url}`}
              watchDetail={latestEpisode}
            />
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          handleNextPage={handleNextPage}
          handlePageChange={handlePageChange}
          handlePreviousPage={handlePreviousPage}
          currentPage={currentPage}
        />
      )}
    </>
  ) : (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500">No anime found</p>
    </div>
  );
}

export default AnimeLists;
