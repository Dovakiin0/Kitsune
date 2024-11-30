import React from "react";
import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Captions, Mic } from "lucide-react";

type Props = {
  className?: string;
  poster: string;
  title: string;
  episodeCard?: boolean;
  sub?: number | null;
  dub?: number | null;
  subTitle?: string;
  displayDetails?: boolean;
  variant?: "sm" | "lg";
  href?: string;
  showGenre?: boolean;
};

const AnimeCard = ({
  displayDetails = true,
  // showGenre = true,
  variant = "sm",
  ...props
}: Props) => {
  return (
    <Link href={props.href as string}>
      <div
        className={cn([
          "rounded-xl overflow-hidden relative cursor-pointer hover:scale-105 duration-300",
          variant === "sm" &&
          "h-[12rem] min-[320px]:h-[16.625rem] sm:h-[18rem] max-w-[12.625rem] md:min-w-[12rem]",
          ,
          variant === "lg" &&
          "max-w-[12.625rem] md:max-w-[18.75rem] h-auto md:h-[25rem] shrink-0 lg:w-[18.75rem]",
          props.className,
        ])}
      >
        <Image
          src={props.poster}
          alt="image"
          height={100}
          width={100}
          className="w-full h-full object-cover"
          unoptimized
        />
        {displayDetails && (
          <>
            <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-accent to-transparent"></div>
            <div className="absolute bottom-0 flex flex-col gap-1 px-4 pb-3">
              <h5 className="line-clamp-1">{props.title}</h5>
              {props.episodeCard ? (
                <div className="flex flex-row items-center space-x-2 ">
                  {props.sub && (
                    <Badge className="bg-red-200 flex flex-row items-center space-x-0.5">
                      <Captions size={"16"} />
                      <span>{props.sub}</span>
                    </Badge>
                  )}
                  {props.dub && (
                    <Badge className="bg-green-200 flex flex-row items-center space-x-0.5">
                      <Mic size={"16"} />
                      <span>{props.dub}</span>
                    </Badge>
                  )}
                  <p className="text-sm text-gray-400">{props.subTitle}</p>
                </div>
              ) : (
                <span>{props.subTitle}</span>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;
