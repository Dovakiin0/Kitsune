export interface IAnime {
  id: string;
  slug: string;
  anilistId: number;
  coverImage: string;
  bannerImage: string;
  status: string;
  season: string;
  title: Title;
  mappings: Mappings;
  currentEpisode: number;
  next: string;
  synonyms: string[];
  countryOfOrigin: string;
  lastEpisodeUpdate: string;
  seasonInt: number;
  description: string;
  duration: number;
  averageScore: number;
  popularity: number;
  color: string;
  year: number;
  createdAt: string;
  updatedAt: string;
  format: string;
  lastChecks: any;
  genre: string[];
  episodes: Episode[];
  relations: Relation[];
}

export interface IRecentAnime {
  id: string;
  anime: IAnime;
  number: number;
  title: string;
  titleVariations: TitleVariations;
  description: string;
  image: string;
  airedAt: string;
  sources: Episodes[];
}

type ISearchAnime = Omit<IAnime, "episodes" | "relations">;

export interface Title {
  native: string;
  romaji: string;
  english: string;
  userPreferred: string;
}

export interface Mappings {
  mal: number;
  anidb: number;
  kitsu: number;
  anilist: number;
  thetvdb: number;
  anisearch: number;
  livechart: number;
  "notify.moe": string;
  "anime-planet": string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  titleVariations: TitleVariations;
  description: string;
  image: string;
  createdAt: string;
  airedAt: string;
  sources: Source[];
}

export interface TitleVariations {
  native: string;
  english: string;
}

export interface Source {
  id: string;
  target: string;
}

export interface EpisodeSource {
  id: string;
  website: string;
  url: string;
  priority: number;
  subtitle: boolean;
}

export interface Relation {
  type: string;
  animeId: string;
  id: string;
  anime: IAnime;
}
