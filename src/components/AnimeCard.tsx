import React from "react";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";

type AnimeProps = {
  id: string;
  title: string;
  src: string;
  additional: string;
};

function AnimeCard({ id, title, src, additional }: AnimeProps) {
  return (
    <div className="w-[180px] lg:w-[200px] rounded-lg">
      <Link href={`/anime/${encodeURIComponent(id)}/watch`}>
        <div className="flex flex-col space-y-2 justify-between bg-base-300 shadow-xl">
          <div className="w-full h-[250px]">
            <img
              src={src}
              alt={title}
              className="hover:opacity-50 hover:scale-110 transition ease-in-out w-full h-full delay-50 object-cover rounded-lg"
            />
          </div>
          <div className="m-2 flex flex-col space-y-3">
            <p className="font-bold text-sm capitalize truncate">{title}</p>
            <div className="flex item-center justify-between">
              <p className="text-accent text-xs">{additional}</p>
              <FaPlay />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default AnimeCard;
