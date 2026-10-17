import { GET_ANIME_DETAILS } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeDetails } from "@/types/anime-details";
import { MediaFull } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const getAnimeDetails = async (animeId: string): Promise<IAnimeDetails> => {
  const res = await api.get<MediaFull>(`/info/${animeId}`);
  const media = res.data;

  const title = media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
  const poster = media.coverImage?.extraLarge || media.coverImage?.large || "";

  const charactersVoiceActors = (media.characters?.edges || [])
    .filter((edge) => edge && edge.node && edge.node.id)
    .map((edge) => ({
      character: {
        id: String(edge.node.id),
        poster: edge.node.image?.large || "",
        name: edge.node.name?.full || "Unknown",
        cast: edge.role,
      },
      voiceActor: {
        id: String(edge.voiceActors?.[0]?.id || ""),
        poster: edge.voiceActors?.[0]?.image?.large || "",
        name: edge.voiceActors?.[0]?.name?.full || "Unknown",
        cast: edge.voiceActors?.[0]?.languageV2 || "Japanese",
      },
    }));

  const seasons = (media.relations?.edges || [])
    .filter((edge) => edge && edge.node && edge.node.id)
    .map((edge) => ({
      id: String(edge.node.id),
      name: edge.node.title?.english || edge.node.title?.romaji || "Related Anime",
      title: edge.relationType || "Relation",
      poster: edge.node.coverImage?.large || edge.node.coverImage?.extraLarge || "",
      isCurrent: edge.node.id === media.id,
    }));

  const recommendedAnimes = (media.recommendations?.nodes || [])
    .filter((rec) => rec && rec.mediaRecommendation && rec.mediaRecommendation.id)
    .map((rec) => {
      const rMedia = rec.mediaRecommendation;
      return {
        id: String(rMedia.id),
        name: rMedia.title?.english || rMedia.title?.romaji || "Untitled",
        jname: rMedia.title?.native || rMedia.title?.romaji || "",
        poster: rMedia.coverImage?.extraLarge || rMedia.coverImage?.large || "",
        duration: `${rMedia.episodes || 0} eps`,
        type: rMedia.format || "TV",
        episodes: {
          sub: rMedia.episodes || 0,
          dub: rMedia.episodes || 0,
        },
      };
    });

  const airedString = media.startDate?.year
    ? `${media.startDate.year}-${media.startDate.month || 1}-${media.startDate.day || 1}`
    : "N/A";

  const studiosString = media.studios?.nodes?.map((s) => s.name).join(", ") || "N/A";

  const relatedAnimes = (media.relations?.edges || [])
    .filter((edge) => edge && edge.node && edge.node.id)
    .map((edge) => {
      const rNode = edge.node;
      return {
        id: String(rNode.id),
        name: rNode.title?.english || rNode.title?.romaji || "Untitled",
        jname: rNode.title?.native || rNode.title?.romaji || "",
        poster: rNode.coverImage?.extraLarge || rNode.coverImage?.large || "",
        duration: `${rNode.episodes || 0} eps`,
        type: rNode.format || edge.relationType || "TV",
        episodes: {
          sub: rNode.episodes || 0,
          dub: rNode.episodes || 0,
        },
      };
    });

  return {
    anime: {
      info: {
        id: String(media.id),
        anilistId: media.id,
        malId: media.idMal || 0,
        name: title,
        poster: poster,
        bannerImage: media.bannerImage || media.coverImage?.extraLarge || "",
        description: media.description || "",
        stats: {
          rating: media.averageScore ? `${media.averageScore}%` : "N/A",
          quality: "HD",
          episodes: {
            sub: media.episodes || 0,
            dub: media.episodes || 0,
          },
          type: media.format || "TV",
          duration: media.duration ? `${media.duration} min` : "N/A",
        },
        promotionalVideos: media.trailer?.id
          ? [
              {
                title: "Trailer",
                source: media.trailer.site === "youtube" ? `https://www.youtube.com/watch?v=${media.trailer.id}` : media.trailer.id,
                thumbnail: media.trailer.thumbnail || "",
              },
            ]
          : [],
        charactersVoiceActors,
      },
      moreInfo: {
        japanese: media.title?.native || "",
        synonyms: media.synonyms?.join(", ") || "",
        aired: airedString,
        premiered: media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : "N/A",
        duration: media.duration ? `${media.duration} min` : "N/A",
        status: media.status || "N/A",
        malscore: media.meanScore ? String(media.meanScore) : "N/A",
        genres: media.genres || [],
        studios: studiosString,
        producers: [],
      },
    },
    seasons,
    mostPopularAnimes: [],
    relatedAnimes,
    recommendedAnimes,
  };
};

export const useGetAnimeDetails = (animeId: string) => {
  return useQuery({
    queryFn: () => getAnimeDetails(animeId),
    queryKey: [GET_ANIME_DETAILS, animeId],
    enabled: !!animeId,
  });
};

