import AnimeCard from "@/components/anime-card";
import { ROUTES } from "@/constants/routes";
import useBookMarks from "@/hooks/use-get-bookmark";
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  status: string;
};

function AnimeLists(props: Props) {
  const [currentPage, setPage] = React.useState(1);

  const { bookmarks, totalPages } = useBookMarks({
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

  return bookmarks && bookmarks.length > 0 ? (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
        {bookmarks.map((bookmark) => {
          const latestEpisode = bookmark.expand.watchHistory
            ? bookmark.expand.watchHistory.sort(
                (a, b) => b.episodeNumber - a.episodeNumber,
              )[0]
            : null;

          let url = latestEpisode
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
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem onClick={handlePreviousPage}>
              <PaginationPrevious href="#" />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => {
                return (
                  page === 1 || // Always show first page
                  page === totalPages || // Always show last page
                  Math.abs(page - currentPage) <= 1 // Show current and its neighbors
                );
              })
              .reduce((acc: (number | "...")[], page, i, arr) => {
                if (i > 0 && page - (arr[i - 1] as number) > 1) {
                  acc.push("...");
                }
                acc.push(page);
                return acc;
              }, [])
              .map((page, index) => (
                <PaginationItem
                  key={index}
                  onClick={() =>
                    typeof page === "number" && handlePageChange(page)
                  }
                >
                  {page === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink href="#" isActive={page === currentPage}>
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

            <PaginationItem onClick={handleNextPage}>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  ) : (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500">No anime found</p>
    </div>
  );
}

export default AnimeLists;
