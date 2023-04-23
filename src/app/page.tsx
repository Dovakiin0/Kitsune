import AnimeCard from "@/components/AnimeCard";
import { TRecentAnime, TPopularAnime } from "@/@types/AnimeType";
import Carousel from "@/components/Carousel";
import useAnime from "@/hooks/useAnime";

export default async function Home() {
  const { getRecent, getPopular } = useAnime();
  const recentAnimes = await getRecent();
  const popularAnimes = await getPopular();

  return (
    <div>
      <Carousel />
      <div className="lg:flex">
        <div className="lg:m-10 mt-10 flex flex-col items-center justify-center lg:items-start lg:justify-start">
          <h2 className="text-xl mb-10 uppercase font-bold text-pink-200 tracking-widest">
            Recent Release
          </h2>
          <div className="flex flex-wrap gap-2 lg:gap-5 justify-start">
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
          <div className="flex flex-wrap gap-2 lg:gap-5 justify-start">
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
      </div>
    </div>
  );
}
