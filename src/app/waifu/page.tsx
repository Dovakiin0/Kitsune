import { TWaifuCategory } from "@/@types/WaifuCategory";
import useWaifu from "@/hooks/useWaifu";
import KitsuneMasonry from "./KitsuneMasonry";

async function page() {
  const { getManyWaifu } = useWaifu();
  let category: TWaifuCategory = "waifu";
  const waifuInfo = await getManyWaifu(category);

  return <KitsuneMasonry waifuInfo={waifuInfo} />;
}

export default page;
