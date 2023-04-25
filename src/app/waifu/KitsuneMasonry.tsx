"use client";
import { TWaifuImage } from "@/@types/WaifuCategory";
import React from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

type KMProps = {
  waifuInfo: TWaifuImage;
};

function KitsuneMasonry({ waifuInfo }: KMProps) {
  // const [waifu, setWaifu] = useState<string[]>(waifuInfo.files);

  // const observer = useRef<any>();
  // const lastImageElementRef = useCallback((node: HTMLImageElement) => {
  //   if (observer.current) observer.current.disconnect();
  //   observer.current = new IntersectionObserver((entries: any) => {
  //     if (entries[0].isIntersecting) {
  //       fetchNewWaifu();
  //     }
  //   });
  //   if (node) observer.current.observe(node);
  // }, []);
  //
  // const fetchNewWaifu = async () => {
  //
  // };

  return (
    <ResponsiveMasonry columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 5 }}>
      <Masonry gutter="10px">
        {waifuInfo.files.map((waifu: string, index: number) => {
          // if (waifu.length === index + 1) {
          //   return (
          //     <img
          //       key={index}
          //       ref={lastImageElementRef}
          //       src={waifu}
          //       className="rounded-lg"
          //     />
          //   );
          // }
          return <img key={index} src={waifu} className="rounded-lg" />;
        })}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export default KitsuneMasonry;
