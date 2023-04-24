import AnimeCard from "@/components/AnimeCard";
import {
  TRecentAnime,
  TPopularAnime,
  TSpotlightAnime,
  TTrendingAnime,
} from "@/@types/AnimeType";
import Carousel from "@/components/Carousel";
import useAnime from "@/hooks/useAnime";
import TrendingAnimeCard from "@/components/TrendingAnimeCard";

export default async function Home() {
  const { getRecent, getPopular, getSpotlight, getTrending } = useAnime();
  const recentAnimes = await getRecent();
  const popularAnimes = await getPopular();
  const spotlightInfo: TSpotlightAnime[] = await getSpotlight();
  const trendingAnimes: TTrendingAnime[] = await getTrending();

  return (
    <div>
      <Carousel spotlightInfo={spotlightInfo} />
      <div className="lg:flex">
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start flex-grow">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent Release
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 xl:gap-6 gap-3">
            {recentAnimes.results.map((anime: TRecentAnime, index: number) => (
              <AnimeCard
                id={anime.id}
                key={index}
                title={
                  anime.title !== ""
                    ? anime.title
                    : anime.id.split("-").join(" ").toString()
                }
                src={anime.image}
                additional={`Episode: ${anime.episodeNumber}`}
              />
            ))}
          </div>
          <p className="text-xl mt-10 mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Popular Release
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 xl:gap-6 gap-3">
            {popularAnimes.results.map(
              (anime: TPopularAnime, index: number) => (
                <AnimeCard
                  id={anime.id}
                  key={index}
                  title={
                    anime.title !== ""
                      ? anime.title
                      : anime.id.split("-").join(" ").toString()
                  }
                  src={anime.image}
                  additional={``}
                />
              )
            )}
          </div>
        </div>
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Trending Anime
          </h2>
          <div className="flex flex-col space-y-5 m-3 lg:m-0">
            {trendingAnimes.map((anime: TTrendingAnime, index: number) => (
              <TrendingAnimeCard key={index} anime={anime} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
