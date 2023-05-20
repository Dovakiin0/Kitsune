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
