import React, { useState, useRef, useEffect } from "react";
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
  const debouncedValue = useDebounce(searchValue, 300);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const { data: searchResults, isLoading } = useSearchAnime(debouncedValue);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleAnimeClick = () => {
    setSearchValue("");
    setIsFocused(false);
    if (onAnimeClick) {
      onAnimeClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchValue.trim())}`);
      setIsFocused(false);
      if (onAnimeClick) {
        onAnimeClick();
      }
      setSearchValue("");
    }
  };

  return (
    <div ref={containerRef} className={cn(["relative w-full min-h-fit", className])}>
      <SearchIcon suppressHydrationWarning className="absolute inset-y-0 left-2 m-auto h-4 w-4" />
      <Input
        className="w-full h-10 pl-8 text-white border-white"
        placeholder="Enter your keywords to search..."
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        value={searchValue}
        onKeyDown={handleKeyDown}
      />
      <Button
        variant="secondary"
        className="absolute text-white right-2 top-1/2 -translate-y-1/2 h-2/3"
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
          className="absolute w-full max-h-[40vh] hidden lg:flex overflow-y-auto flex-col gap-5 px-5 py-5 bg-secondary top-[110%] rounded-md z-50 shadow-2xl border border-white/10"
        >
          <div className="grid grid-cols-1 gap-2">
            {(isLoading || (!searchResults && !!debouncedValue)) &&
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

            {!isLoading && searchResults && searchResults.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No anime found</p>
            )}

            {searchResults?.map((anime) => (
              <Link key={anime.id} href={ROUTES.ANIME_DETAILS + "/" + anime.id}>
                <div
                  className="flex items-start gap-4 hover:bg-[#121212] rounded-md p-2 cursor-pointer"
                  onClick={handleAnimeClick}
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
                      {anime.name || anime.jname}
                    </h3>
                    <div>
                      <div className="text-sm">{anime.type}</div>
                      <p className="text-xs text-gray-300">
                        {anime.moreInfo?.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              className="w-full"
              href={`${ROUTES.SEARCH}?q=${encodeURIComponent(searchValue)}`}
              onClick={handleAnimeClick}
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
          className="absolute w-full h-fit max-h-[50vh] overflow-y-auto lg:hidden flex flex-col gap-2 px-2 py-2 bg-secondary top-[110%] rounded-md z-50 shadow-2xl border border-white/10"
        >
          <div className="flex flex-col gap-1">
            {(isLoading || (!searchResults && !!debouncedValue)) &&
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

            {!isLoading && searchResults && searchResults.length === 0 && (
              <p className="text-sm text-gray-400 py-3 text-center">No anime found</p>
            )}

            {searchResults?.slice(0, 5).map((anime) => (
              <Link key={anime.id} href={ROUTES.ANIME_DETAILS + "/" + anime.id}>
                <div
                  className="flex items-center gap-2 hover:bg-[#121212] rounded-md p-1 cursor-pointer"
                  onClick={handleAnimeClick}
                >
                  <div className="h-[2.5rem] w-[1.875rem] overflow-hidden rounded-md flex-shrink-0">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      height={100}
                      width={100}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-sm overflow-hidden">
                    <h3 className="truncate">{anime.name || anime.jname}</h3>
                    <div>
                      <div className="text-xs text-gray-400">{anime.type}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            <Link
              className="w-full mt-1"
              href={`${ROUTES.SEARCH}?q=${encodeURIComponent(searchValue)}`}
              onClick={handleAnimeClick}
            >
              <Button size="sm" className="w-full bg-[#e9376b] text-white">
                Show More
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
