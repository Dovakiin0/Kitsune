import React from "react";
import {
  Pagination as PaginationShad,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  currentPage: number;
  totalPages: number;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  handlePageChange: (pageNumber: number) => void;
};

function Pagination({
  currentPage,
  totalPages,
  handleNextPage,
  handlePreviousPage,
  handlePageChange,
}: Props) {
  return (
    <PaginationShad className="mt-10">
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
              onClick={() => typeof page === "number" && handlePageChange(page)}
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
    </PaginationShad>
  );
}

export default Pagination;
