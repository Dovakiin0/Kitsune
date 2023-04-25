"use client";
import { TWaifuImage } from "@/@types/WaifuCategory";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

type KitsuneMasonryProps = {
  waifuPics: TWaifuImage;
};

function KitsuneMasonry({ waifuPics }: KitsuneMasonryProps) {
  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 350: 2, 750: 5, 900: 5 }}>
      <Masonry gutter="10px">
        {waifuPics.files.map((waifu: string) => (
          <img src={waifu} className="rounded-lg" />
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export default KitsuneMasonry;
