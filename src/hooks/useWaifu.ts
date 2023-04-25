import { TWaifuCategory, TWaifuImage } from "@/@types/WaifuCategory";
import { WAIFU_URI } from "@/utils/constants";

export default function useWaifu() {
  let API = {
    many: WAIFU_URI + "/many",
  };

  async function getManyWaifu(category: TWaifuCategory): Promise<TWaifuImage> {
    const data = await fetch(`${API.many}/sfw/${category}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify({}),
    });
    return data.json();
  }

  return { getManyWaifu };
}
