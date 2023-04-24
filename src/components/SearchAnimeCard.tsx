import Link from "next/link";
import React from "react";

interface SearchAnimeCardProps {
  id: string;
  src: string;
  title: string;
  additional: string;
  cb: () => void;
}

function SearchAnimeCard({
  id,
  src,
  title,
  additional,
  cb,
}: SearchAnimeCardProps) {
  return (
    <Link
      href={`/anime/${id}/watch`}
      onClick={() => cb()}
      className="flex items-center gap-5 p-5 hover:cursor-pointer hover:bg-base-300 hover:text-pink-200"
    >
      <img
        src={src}
        alt={title}
        width={50}
        height={50}
        className="object-contain"
      />
      <div className="">
        <p className="font-bold break-word capitalize">{title}</p>
        <p className="text-accent">{additional}</p>
      </div>
    </Link>
  );
}

export default SearchAnimeCard;
