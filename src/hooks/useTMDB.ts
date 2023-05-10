import { TMDB_URI } from "@/utils/constants";

export default function useTMDB() {
  const API = {
    search: TMDB_URI + "/search/tv?query=",
    logo: TMDB_URI + "/tv",
  };

  async function getTMDBBestSearch(query: string) {
    const res = await fetch(API.search + query, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MmFmODlmMDkzOTMyY2UwNmJmNmZiZjAwMzI3YjFlZSIsInN1YiI6IjYwYTFmMWEwYjBiYTdlMDA1ODQwMmFiOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.g9Q4IzacEEki4VQZS_YLcCt2RYvkVq2s0H0pICiY3UE`,
        accept: "application/json",
      },
    });

    const infoData = await res.json();
    if (infoData.results.length <= 0) return;
    return getTMDBLogo(infoData.results[0].id);
  }

  async function getTMDBLogo(id: number) {
    const res = await fetch(`${API.logo}/${id}/images`, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MmFmODlmMDkzOTMyY2UwNmJmNmZiZjAwMzI3YjFlZSIsInN1YiI6IjYwYTFmMWEwYjBiYTdlMDA1ODQwMmFiOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.g9Q4IzacEEki4VQZS_YLcCt2RYvkVq2s0H0pICiY3UE`,
        accept: "application/json",
      },
    });
    const infoData = await res.json();
    return infoData;
  }

  return { getTMDBBestSearch, getTMDBLogo };
}
