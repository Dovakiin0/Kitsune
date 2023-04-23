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
    <Link href={`/anime/${encodeURIComponent(id)}/watch`}>
      <div className="card card-compact w-[120px] h-[250px] md:w-[180px] lg:w-[200px] lg:h-[350px] bg-base-300 shadow-xl">
        <figure className="lg:h-[250px] h-[150px]">
          <img
            src={src}
            alt={title}
            className="hover:opacity-50 hover:scale-110 transition ease-in-out w-full h-full delay-50 object-cover"
          />
        </figure>
        <div className="card-body ">
          <p className="font-bold capitalize truncate">{title}</p>
          <div className="flex item-center justify-between">
            <p className="text-accent text-xs">{additional}</p>
            <FaPlay />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default AnimeCard;
