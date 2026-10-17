import { api } from "@/lib/api";
import { AnilistAnimes } from "@/types/anilist-animes";
import { useMutation } from "@tanstack/react-query";

const getAnilistAnimes = async (username: string) => {
  const res = await api.post("https://graphql.anilist.co", {
    query: `
      query ($username: String) {
         MediaListCollection(type: ANIME, userName: $username) {
          lists {
            name
            status
            entries {
              media {
                id
                bannerImage
                coverImage {
                  extraLarge
                  large
                }
                idMal
                title {
                  english
                  romaji
                  native
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      username,
    },
  });
  const data = res.data as AnilistAnimes;
  return data.data;
};

export const useGetAnilistAnimes = () => {
  return useMutation({
    mutationFn: getAnilistAnimes,
    onError: (error) => {
      console.error("Error fetching Anilist animes:", error);
    },
  });
};
