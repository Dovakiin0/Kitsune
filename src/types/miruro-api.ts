export interface FuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface Title {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface CoverImage {
  large: string;
  extraLarge?: string;
  color?: string | null;
}

export interface Studio {
  id?: number;
  name: string;
  isAnimationStudio: boolean;
  siteUrl?: string;
}

export interface NextAiringEpisode {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export type MediaFormat = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" | "MUSIC";

export type MediaStatus =
  | "RELEASING"
  | "FINISHED"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export type SortOption =
  | "SCORE_DESC"
  | "POPULARITY_DESC"
  | "TRENDING_DESC"
  | "START_DATE_DESC"
  | "FAVOURITES_DESC"
  | "UPDATED_AT_DESC";

export interface PaginatedResponse<T> {
  page: number;
  perPage: number;
  total: number;
  hasNextPage: boolean;
  results: T[];
}

export interface MediaList {
  id: number;
  title: Title;
  coverImage: CoverImage;
  bannerImage: string | null;
  format: MediaFormat;
  season: MediaSeason | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  status: MediaStatus;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number;
  favourites: number;
  genres: string[];
  source: string | null;
  countryOfOrigin: string;
  isAdult: boolean;
  studios: {
    nodes: Studio[];
  };
  nextAiringEpisode: NextAiringEpisode | null;
  startDate: FuzzyDate;
  endDate: FuzzyDate;
}

export interface ScheduleItem extends MediaList {
  next_episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface MediaTag {
  name: string;
  rank: number;
  isMediaSpoiler: boolean;
}

export interface CharacterEdge {
  role: "MAIN" | "SUPPORTING";
  node: {
    id: number;
    name: {
      full: string;
      native?: string;
      userPreferred?: string;
    };
    image: {
      large: string;
      medium?: string;
    };
    description?: string;
    gender?: string;
    dateOfBirth?: FuzzyDate;
    age?: string;
    favourites?: number;
    siteUrl?: string;
  };
  voiceActors: Array<{
    id: number;
    name: {
      full: string;
      native?: string;
    };
    image: {
      large: string;
    };
    languageV2: string;
  }>;
}

export interface StaffEdge {
  role: string;
  node: {
    id: number;
    name: {
      full: string;
      native?: string;
    };
    image: {
      large: string;
    };
  };
}

export interface RelationEdge {
  relationType: string;
  node: {
    id: number;
    title: Title;
    coverImage: CoverImage;
    bannerImage?: string | null;
    format: MediaFormat;
    type: string;
    status: MediaStatus;
    episodes: number | null;
    chapters?: number | null;
    meanScore: number | null;
    averageScore?: number | null;
    popularity?: number;
    startDate?: FuzzyDate;
  };
}

export interface RecommendationNode {
  rating: number;
  mediaRecommendation: {
    id: number;
    title: Title;
    coverImage: CoverImage;
    bannerImage?: string | null;
    format: MediaFormat;
    episodes: number | null;
    status: MediaStatus;
    meanScore: number | null;
    averageScore: number | null;
    popularity?: number;
    genres?: string[];
    startDate?: { year: number | null };
  };
}

export interface MediaFull extends MediaList {
  idMal: number | null;
  description: string | null;
  trending: number;
  tags: MediaTag[];
  hashtag: string | null;
  synonyms: string[];
  siteUrl: string;
  trailer: {
    id: string;
    site: string;
    thumbnail: string;
  } | null;
  characters: {
    edges: CharacterEdge[];
  };
  staff: {
    edges: StaffEdge[];
  };
  relations: {
    edges: RelationEdge[];
  };
  recommendations: {
    nodes: RecommendationNode[];
  };
  externalLinks: Array<{
    url: string;
    site: string;
    type: string;
  }>;
  streamingEpisodes: Array<{
    title: string;
    thumbnail: string;
    url: string;
    site: string;
  }>;
  stats: {
    scoreDistribution: Array<{ score: number; amount: number }>;
    statusDistribution: Array<{ status: string; amount: number }>;
  };
}

export interface SearchSuggestionItem {
  id: number;
  title: string | null;
  title_romaji: string | null;
  poster: string;
  format: MediaFormat | null;
  status: MediaStatus | null;
  year: number | null;
  episodes: number | null;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestionItem[];
}

export interface ProviderEpisodeItem {
  id: string;
  number: number;
  title?: string;
  image?: string;
  airDate?: string;
  duration?: number;
  filler?: boolean;
}

export interface ProviderCategory {
  sub?: ProviderEpisodeItem[];
  dub?: ProviderEpisodeItem[];
}

export interface EpisodeResponse {
  mappings: {
    anilistId: number;
    malId?: number;
    kitsuId?: number;
    nextAiringEpisode?: NextAiringEpisode | null;
    [key: string]: any;
  };
  providers: Record<
    string,
    {
      episodes: ProviderCategory;
    }
  >;
}

export interface StreamSourceItem {
  url: string;
  type: string;
  quality?: string;
  server?: string;
  referer?: string;
  headers?: Record<string, string>;
  playlist_key?: string;
  key?: string;
  subtitles?: Array<{
    url?: string;
    file?: string;
    label?: string;
    lang?: string;
    srclang?: string;
    default?: boolean;
  }>;
  priority?: number;
  isActive?: boolean;
}

export interface SubtitleItem {
  file?: string;
  url?: string;
  label?: string;
  lang?: string;
  srclang?: string;
  kind?: string;
  default?: boolean;
}

export interface SkipInterval {
  start: number;
  end: number;
}

export interface WatchSourcesResponse {
  anilistId?: number;
  episode?: number;
  audio?: "sub" | "dub";
  streams: StreamSourceItem[];
  subtitles?: SubtitleItem[];
  intro?: SkipInterval;
  outro?: SkipInterval;
  headers?: Record<string, string>;
}
