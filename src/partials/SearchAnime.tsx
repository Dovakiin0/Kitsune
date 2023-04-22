"use client";
import React, { useState, useEffect } from "react";
import SearchAnimeCard from "@/components/SearchAnimeCard";
import { TSearchAnime } from "@/@types/AnimeType";
import useAnime from "@/hooks/useAnime";
import Loading from "@/components/LoadingSingle";

function Search() {
  const [search, setSearch] = useState("");
  const [searchFilter, setSearchFilter] = useState<TSearchAnime[]>([]);
  const [loading, setLoading] = useState(false);
  const { getSearch } = useAnime();

  useEffect(() => {
    if (search === "") return setSearchFilter([]);
    setTimeout(async () => {
      setLoading(true);
      const data = await getSearch(search);
      setSearchFilter(data.results.slice(0, 5));
      setLoading(false);
    }, 1000);
  }, [search]);

  const handleSearchCallback = () => {
    setSearch("");
    setSearchFilter([]);
  };

  return (
    <>
      <input
        type="text"
        placeholder="Search Anime"
        className="input input-md input-bordered w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="absolute">
        <div
          className="mt-5 bg-base-100 shadow-lg rounded-lg"
          style={{ width: "400px" }}
        >
          {loading ? (
            <div className="flex gap-5 items-center">
              <Loading />
              <p>Searching...</p>
            </div>
          ) : searchFilter.length > 0 ? (
            <>
              {searchFilter.map((anime) => (
                <SearchAnimeCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.title}
                  src={anime.image}
                  additional={anime.releaseDate ?? ""}
                  cb={handleSearchCallback}
                />
              ))}
              <a className="btn btn-secondary w-full">See More</a>
            </>
          ) : (
            ""
          )}
        </div>
      </div>
    </>
  );
}

export default Search;
