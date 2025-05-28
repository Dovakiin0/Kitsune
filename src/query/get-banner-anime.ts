import { GET_ANIME_BANNER } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { useQuery } from "react-query";

interface IAnimeBanner {
  Media: {
    id: number;
    bannerImage: string;
  };
}

const getAnimeBanner = async (anilistID: number) => {
  const res = await api.post("https://graphql.anilist.co", {
    query: `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          bannerImage
        }
      }
    `,
    variables: {
      id: anilistID,
    },
  });
  return res.data.data as IAnimeBanner;
};

export const useGetAnimeBanner = (anilistID: number) => {
  return useQuery({
    queryFn: () => getAnimeBanner(anilistID),
    queryKey: [GET_ANIME_BANNER, anilistID],
    enabled: !!anilistID,
  });
};
