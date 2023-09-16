export type TEpisodeInfo = {
  headers: {
    Referer: string;
    watchsb: string;
    "User-Agent": string;
  };
  sources: TEpisodeSources[];
  thumbnail?: string | null;
  subtitles: {
    url: string;
    lang: string;
  }[];
};

export type TEpisodeSources = {
  url: string;
  quality: string;
  isM3U8: boolean;
};

export type TWatchedAnime = {
  id: string;
  title: string;
  image: string;
  ep: {
    id: string;
    number: number;
  }[];
};

export interface IAnimeRecent {
  id: string;
  episodeId: string;
  episodeNumber: string;
  title: string;
  image: string;
  url: string;
}

export interface IAnimePopular {
  id: string;
  title: string;
  image: string;
  url: string;
  genres: string[];
}

export interface IAnimeInfo {
  id: string;
  title: string;
  url: string;
  genres: string[];
  totalEpisodes: number;
  image: string;
  releaseDate: string;
  description: string;
  subOrDub: string;
  type: string;
  status: string;
  otherName: string;
  episodes: IEpisodes[];
}

export interface IEpisodes {
  id: string;
  number: number;
  url: string;
}

export interface ITmdbImage {
  backdrops: Logos[];
  id: number;
  logos: Logos[];
  poster: Logos[];
}

export interface ISearchAnime {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string;
  subOrDub: string;
}
