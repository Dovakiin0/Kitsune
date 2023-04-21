import AnimeCard from "@/components/AnimeCard";
import { TRecentAnime, TPopularAnime } from "@/@types/AnimeType";

async function getRecent() {
  const data = await fetch(
    "https://api.consumet.org/anime/gogoanime/recent-episodes"
  );
  return data.json();
}

async function getPopular() {
  const data = await fetch(
    "https://api.consumet.org/anime/gogoanime/top-airing"
  );
  return data.json();
}

export default async function Home() {
  const recentAnimes = await getRecent();
  const popularAnimes = await getPopular();

  return (
    <div className="lg:m-10 mt-10">
      <h2 className="text-xl mb-10 uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest">
        Recent Release
      </h2>
      <div className="flex flex-wrap gap-5">
        {recentAnimes.results.map((anime: TRecentAnime, index: number) => (
          <AnimeCard
            key={index}
            title={anime.title}
            src={anime.image}
            additional={`Episode: ${anime.episodeNumber}`}
          />
        ))}
      </div>
      <p className="text-xl mt-10 mb-10 uppercase font-bold tracking-widest">
        Popular Release
      </p>
      <div className="flex flex-wrap gap-5">
        {popularAnimes.results.map((anime: TPopularAnime, index: number) => (
          <AnimeCard
            key={index}
            title={anime.title}
            src={anime.image}
            additional={``}
          />
        ))}
      </div>
    </div>
  );
}
