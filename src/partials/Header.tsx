import React from "react";
import SearchAnime from "@/partials/SearchAnime";
import { nightTokyo } from "@/utils/fonts";
import Image from "next/image";

function Header() {
  return (
    <>
      <div className="navbar bg-gradient-to-b from-base-300 to-transparent lg:absolute lg:top-0 lg:z-50">
        <div className="navbar-start">
          <div className="flex items-center">
            <Image src="/icon.png" alt="logo" width="80" height="80" />
            <a
              href="/"
              className={`${nightTokyo.className} btn btn-ghost font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest`}
            >
              KITSUNE
            </a>
          </div>
        </div>
        <div className="navbar-end gap-2 hidden lg:flex">
          <div className="w-full lg:w-1/2 mr-1">
            <SearchAnime />
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <SearchAnime />
      </div>
    </>
  );
}

export default Header;
