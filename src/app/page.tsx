import AnimeCard from "@/components/AnimeCard";
import Carousel from "@/components/Carousel";
import useAnime from "@/hooks/useAnime";
import NewsCard from "@/components/NewsCard";
import useNews from "@/hooks/useNews";
import { TNewsFeed } from "@/@types/NewsType";
import ContinueWatching from "@/partials/ContinueWatching";
import { IAnime, IRecentAnime } from "@/@types/EnimeType";
import Script from "next/script";

export default async function Home() {
  const { getRecent, getPopular } = useAnime();
  const { getRecentNews } = useNews();
  const recentAnimes: { data: IRecentAnime[] } = await getRecent();
  const popularAnimes: { data: IAnime[] } = await getPopular();
  const recentNews: TNewsFeed[] = await getRecentNews();

  return (
    <div>
      <Carousel spotlightInfo={popularAnimes.data.slice(0, 10)} />
      <div className="xl:flex justify-between">
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start">
          <p className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent Release
          </p>

          <div className="flex flex-wrap justify-between lg:justify-start xl:gap-8 lg:gap-6 gap-3 m-2 lg:m-0">
            {recentAnimes.data.map((anime: IRecentAnime, index: number) => (
              <AnimeCard
                id={anime.anime.slug}
                key={index}
                title={anime.anime.title.romaji}
                src={anime.anime.coverImage}
                additional={`Episode: ${anime.number}`}
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
            {popularAnimes.data.map((anime: IAnime, index: number) => (
              <AnimeCard
                id={anime.slug}
                key={index}
                title={anime.title.romaji}
                src={anime.coverImage}
                additional={anime.status}
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
            <Script
              strategy="afterInteractive"
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6976508775648408"
            ></Script>
            <Script id="google-ads" strategy="afterInteractive">
              {`
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-6976508775648408"
     data-ad-slot="5888714671"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`}
            </Script>
          </div>
        </div>
      </div>
    </div>
  );
}
