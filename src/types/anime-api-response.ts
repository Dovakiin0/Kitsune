import { IAnime, ISuggestionAnime } from "./anime";

export interface IAnimeResponse {
  currentPage: number;
  hasNextPage: boolean;
  data: Array<IAnime>;
}

export interface ISugggestionResponse {
  data: {
    suggestions: Array<ISuggestionAnime>;
  };
}
