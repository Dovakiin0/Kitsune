import React, { useState, useRef } from "react";
import { Input } from "./ui/input";
import { SearchIcon, SlidersHorizontal } from "lucide-react";
import useDebounce from "@/hooks/use-debounce";
import { useSearchAnime } from "@/query/search-anime";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import Tooltip from "./common/tooltip";

const SearchBar = ({
  className,
  onAnimeClick,
}: {
  className?: string;
  onAnimeClick?: () => void;
}) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const debouncedValue = useDebounce(searchValue, 1000);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const { data: searchResults, isLoading } = useSearchAnime(debouncedValue);

  const handleBlur = () => {
    setTimeout(() => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(document.activeElement)
      ) {
        setIsFocused(false);
      }
    }, 100);
  };

  const handleAnimeClick = () => {
    setSearchValue("");
    setIsFocused(false);
    if (onAnimeClick) {
      onAnimeClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      // Redirect to the search results page
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchValue)}`);
      setIsFocused(false); // Hide the dropdown results
      if (onAnimeClick) {
        onAnimeClick();
      }
      setSearchValue("");
    }
  };

  return (
    <div className={cn([" relative w-full min-h-fit", className])}>
        <SearchIcon suppressHydrationWarning className="absolute inset-y-0 left-2 m-auto h-4 w-4" />
      <Input
        className="w-full h-10 pl-8 text-white border-white"
        placeholder="Enter your keywords to search..."
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        value={searchValue}
        onKeyDown={handleKeyDown}
      />
      <Button
        variant="secondary"
        className="absolute  text-white right-2 top-1/2 -translate-y-1/2 h-2/3"
        onClick={() => {
          router.push(ROUTES.SEARCH + '?q=""');
        }}
      >
        <Tooltip side="bottom" content="Filter">
            <SlidersHorizontal suppressHydrationWarning className="h-4 w-4" />
        </Tooltip>
      </Button>
      {isFocused && searchValue && (
        <div
          ref={resultsRef}
          className="absolute w-full max-h-[40vh] hidden lg:flex overflow-y-auto flex-col gap-5 px-5 py-5 bg-secondary top-[110%] rounded-md"
        >
          <div className="grid grid-cols-1 gap-2">
            {(isLoading || (!searchResults && !!searchValue)) &&
              [1, 2, 3, 4].map((_, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md p-2 bg-slate-700 animate-pulse"
                  >
                    <div className="min-h-[6.25rem] min-w-[5rem] overflow-hidden rounded-md"></div>
                  </div>
                );
              })}

            {searchResults?.map((anime) => (
              <a key={anime.id} href={ROUTES.ANIME_DETAILS + "/" + anime.id}>
                <div
                  className="flex items-start gap-4 hover:bg-[#121212] rounded-md p-2 cursor-pointer"
                  onClick={handleAnimeClick} // Clear search value on click
                >
                  <div className="h-[6.25rem] w-[5rem] overflow-hidden rounded-md flex-shrink-0">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      height={100}
                      width={100}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="line-clamp-2 text-sm">
                      {!!anime.name ? anime.name : anime.jname}
                    </h3>
                    <div>
                      <div className="text-sm">{anime.type}</div>
                      <p className="text-xs text-gray-300">
                        {anime.moreInfo?.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
            <Link
              className="w-full"
              href={`${ROUTES.SEARCH}?q=${encodeURIComponent(searchValue)}`}
            >
              <Button className="w-full bg-[#e9376b] text-white">
                Show More
              </Button>
            </Link>
          </div>
        </div>
      )}

      {isFocused && searchValue && (
        <div
          ref={resultsRef}
          className="absolute w-full h-fit lg:hidden flex flex-col gap-2 px-1 py-2 bg-secondary top-[110%] rounded-md"
        >
          <div className="flex flex-col gap-1">
            {(isLoading || (!searchResults && !!searchValue)) &&
              [1, 2, 3, 4, 5].map((_, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md p-2 bg-slate-700 animate-pulse"
                  >
                    <div className="min-h-[2.25rem] min-w-[1.875rem] overflow-hidden rounded-md"></div>
                  </div>
                );
              })}

            {searchResults?.slice(0, 5).map((anime) => (
              <Link key={anime.id} href={ROUTES.ANIME_DETAILS + "/" + anime.id}>
                <div
                  className="flex items-center gap-2 hover:bg-[#121212] rounded-md p-1 cursor-pointer"
                  onClick={handleAnimeClick} // Clear search value on click
                >
                  <div className="h-[2.5rem] w-[1.875rem] overflow-hidden rounded-md">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      height={100}
                      width={100}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <h3>{!!anime.name ? anime.name : anime.jname}</h3>
                    <div>
                      <div className="text-xs">{anime.rank}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
