import { DOMAIN_URL } from "@/utils/constants";

export default function useTMDB() {
  const API = {
    search: DOMAIN_URL + "/api/tmdb?query=",
  };

  async function getTMDBMap(query: string) {
    const res = await fetch(API.search + query);
    const data = await res.json();
    return data;
  }

  return { getTMDBMap };
}
