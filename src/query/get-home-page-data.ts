import { GET_HOME_PAGE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api"
import { IAnimeData } from "@/types/anime";
import { useQuery } from "react-query";

const getHomePageData = async () => {
    const res = await api.get('/home');
    return res.data.data as IAnimeData;
}

export const useGetHomePageData = () => {
    return useQuery({
        queryFn: getHomePageData,
        queryKey: [GET_HOME_PAGE_DATA],
        refetchOnWindowFocus: false

    })
}