import { DOMAIN_URI } from "@/utils/constants";

export default function useTMDB() {
  const API = {
    search: DOMAIN_URI + "/api/tmdb?query=",
  };

  async function getTMDBMap(query: string) {
    const res = await fetch(API.search + query);
    const data = await res.json();
    return data;
  }

  return { getTMDBMap };
}
