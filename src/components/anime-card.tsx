import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

type Props = {
  className?: string;
};

const AnimeCard = (props: Props) => {
  return (
    <div
      className={cn([
        " h-[15.625rem] w-[10.625rem] rounded-xl overflow-hidden relative cursor-pointer md:h-[18.75rem] md:w-[12.5rem]",
        ,
        props.className,
      ])}
    >
      <Image
        src={
          "https://tradejapanstore.com/cdn/shop/products/9784088801537.jpg?v=1668228163"
        }
        alt="image"
        height={100}
        width={100}
        className="w-full h-full object-cover"
        unoptimized
      />
      <div className="absolute inset-0 m-auto h-full w-full bg-gradient-to-t from-[#000000a9] to-transparent"></div>
      <div className="absolute bottom-0 flex flex-col gap-1 pl-4 pb-3">
        <h5>Haikyu!</h5>
        <p>2021, Action</p>
      </div>
    </div>
  );
};

export default AnimeCard;

