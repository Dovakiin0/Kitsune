import { IAnime } from "./anime";

export interface IAnimeResponse {
    currentPage: number,
    hasNextPage: boolean;
    results: Array<IAnime>
}