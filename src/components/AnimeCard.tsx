import React from "react";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";

type AnimeProps = {
  title: string;
  src: string;
  additional: string;
};

function AnimeCard({ title, src, additional }: AnimeProps) {
  return (
    <Link href={`/${encodeURIComponent(title)}`}>
      <div className="card card-compact w-[180px] lg:w-[200px] h-[350px] bg-base-300 shadow-xl">
        <figure className="h-[250px]">
          <img
            src={src}
            alt={title}
            className="hover:opacity-50 hover:scale-110 transition ease-in-out delay-50"
          />
        </figure>
        <div className="card-body ">
          <p className="font-bold">
            {title.length > 35 ? title.slice(0, 35) + "..." : title}
          </p>
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
