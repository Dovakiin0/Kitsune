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
import NewsCard from "@/components/NewsCard";
import useNews from "@/hooks/useNews";
import { TNewsFeed } from "@/@types/NewsType";

export default async function Home() {
  const { getRecent, getPopular, getSpotlight, getTrending } = useAnime();
  const { getRecentNews } = useNews();
  const recentAnimes = await getRecent();
  const popularAnimes = await getPopular();
  const recentNews: TNewsFeed[] = await getRecentNews();

  const spotlightInfo: TSpotlightAnime[] = await getSpotlight();
  const trendingAnimes: TTrendingAnime[] = await getTrending();
  return (
    <div>
      <Carousel spotlightInfo={spotlightInfo} />
      <div className="xl:flex justify-between">
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent Release
          </h2>
          <div className="flex flex-wrap gap-5">
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
          <div className="flex flex-wrap gap-5">
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
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start xl:w-2/3">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Trending Anime
          </h2>
          <div className="flex flex-col space-y-5 m-3 lg:m-0">
            {trendingAnimes.map((anime: TTrendingAnime, index: number) => (
              <TrendingAnimeCard key={index} anime={anime} />
            ))}
          </div>

          <h2 className="text-xl mt-10 mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent News
          </h2>
          <div className="flex flex-col space-y-5 m-3 lg:m-0">
            {recentNews.splice(0, 5).map((news: TNewsFeed, index: number) => (
              <NewsCard news={news} key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
