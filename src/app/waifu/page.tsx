import { TWaifuCategory } from "@/@types/WaifuCategory";
import useWaifu from "@/hooks/useWaifu";
import React from "react";
import KitsuneMasonry from "./KitsuneMasonry";

async function page() {
  const { getManyWaifu } = useWaifu();
  let category: TWaifuCategory = "waifu";
  const waifuInfo = await getManyWaifu(category);

  return (
    <div>
      <KitsuneMasonry waifuPics={waifuInfo} />
    </div>
  );
}

export default page;
