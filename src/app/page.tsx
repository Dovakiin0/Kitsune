import AnimeCard from "@/components/AnimeCard";
import Carousel from "@/components/Carousel";
import useAnime from "@/hooks/useAnime";
import NewsCard from "@/components/NewsCard";
import useNews from "@/hooks/useNews";
import { TNewsFeed } from "@/@types/NewsType";
import ContinueWatching from "@/partials/ContinueWatching";
import { IAnimePopular, IAnimeRecent } from "@/@types/AnimeType";

export default async function Home() {
  const { getRecent, getPopular } = useAnime();
  const { getRecentNews } = useNews();
  const recentAnimes: IAnimeRecent[] = await getRecent();
  const popularAnimes: IAnimePopular[] = await getPopular();
  const recentNews: TNewsFeed[] = await getRecentNews();

  return (
    <div>
      <Carousel spotlightInfo={popularAnimes.slice(0, 10)} />
      <div className="xl:flex justify-between">
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start">
          <p className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent Release
          </p>

          <div className="flex flex-wrap justify-between lg:justify-start xl:gap-8 lg:gap-6 gap-3 m-2 lg:m-0">
            {recentAnimes.map((anime: IAnimeRecent, index: number) => (
              <AnimeCard
                id={anime.id}
                key={index}
                title={anime.title}
                src={anime.image}
                additional={`Episode: ${anime.episodeNumber}`}
              />
            ))}
          </div>
          <ContinueWatching />
          <p
            className={`text-xl mt-20 lg:mt-30 mb-10 uppercase font-bold text-pink-200 tracking-widest`}
          >
            Popular Release
          </p>
          <div className="flex flex-wrap justify-between lg:justify-start xl:gap-8 lg:gap-6 gap-3 m-2 lg:m-0">
            {popularAnimes.map((anime: IAnimePopular, index: number) => (
              <AnimeCard
                id={anime.id}
                key={index}
                title={anime.title}
                src={anime.image}
                additional={""}
              />
            ))}
          </div>
        </div>
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start xl:w-2/3">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
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
