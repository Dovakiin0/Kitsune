import { TMDB_URI } from "@/utils/constants";

export default function useTMDB() {
  const API = {
    search: TMDB_URI + "/search/tv?query=",
    logo: TMDB_URI + "/tv",
  };

  async function getTMDBBestSearch(query: string) {
    const res = await fetch(API.search + query);

    const infoData = await res.json();

    if (infoData.data.length <= 0) return;
    return getTMDBLogo(infoData.results[0].id);
  }

  async function getTMDBLogo(id: number) {
    const res = await fetch(`${API.logo}/${id}/images`);
    const infoData = await res.json();
    return infoData;
  }

  return { getTMDBBestSearch, getTMDBLogo };
}
