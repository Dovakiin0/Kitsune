import AnimeCard from "@/components/AnimeCard";
import {
  TRecentAnime,
  TPopularAnime,
  TSpotlightAnime,
} from "@/@types/AnimeType";
import Carousel from "@/components/Carousel";
import useAnime from "@/hooks/useAnime";

export default async function Home() {
  const { getRecent, getPopular, getSpotlight } = useAnime();
  const recentAnimes = await getRecent();
  const popularAnimes = await getPopular();
  const spotlightInfo: TSpotlightAnime[] = await getSpotlight();
  return (
    <div>
      <Carousel spotlightInfo={spotlightInfo} />
      <div className="lg:flex justify-between">
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent Release
          </h2>
          <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
            {recentAnimes.results.map((anime: TRecentAnime, index: number) => (
              <AnimeCard
                id={anime.id}
                key={index}
                title={anime.title}
                src={anime.image}
                additional={`Episode: ${anime.episodeNumber}`}
              />
            ))}
          </div>
          <p className="text-xl mt-10 mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Popular Release
          </p>
          <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
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
        </div>
      </div>
    </div>
  );
}
