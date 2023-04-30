export interface IKitsuAnime {
  id: string;
  type: string;
  links: Links;
  attributes: Attributes;
  relationships: Relationships;
}

export interface Links {
  self: string;
}

export interface Attributes {
  createdAt: string;
  updatedAt: string;
  slug: string;
  synopsis: string;
  description: string;
  coverImageTopOffset: number;
  titles: Titles;
  canonicalTitle: string;
  abbreviatedTitles: string[];
  averageRating: string;
  ratingFrequencies: RatingFrequencies;
  userCount: number;
  favoritesCount: number;
  startDate: string;
  endDate: any;
  nextRelease: any;
  popularityRank: number;
  ratingRank: number;
  ageRating: string;
  ageRatingGuide: string;
  subtype: string;
  status: string;
  tba: any;
  posterImage: PosterImage;
  coverImage: CoverImage;
  episodeCount: number;
  episodeLength: any;
  totalLength: number;
  youtubeVideoId: string;
  showType: string;
  nsfw: boolean;
}

export interface Titles {
  en: string;
  en_jp: string;
  ja_jp: string;
}

export interface RatingFrequencies {
  "2": string;
  "3": string;
  "4": string;
  "6": string;
  "7": string;
  "8": string;
  "9": string;
  "10": string;
  "11": string;
  "12": string;
  "13": string;
  "14": string;
  "15": string;
  "16": string;
  "17": string;
  "18": string;
  "20": string;
}

export interface PosterImage {
  tiny: string;
  large: string;
  small: string;
  medium: string;
  original: string;
  meta: Meta;
}

export interface Meta {
  dimensions: Dimensions;
}

export interface Dimensions {
  tiny: Tiny;
  large: Large;
  small: Small;
  medium: Medium;
}

export interface Tiny {
  width: number;
  height: number;
}

export interface Large {
  width: number;
  height: number;
}

export interface Small {
  width: number;
  height: number;
}

export interface Medium {
  width: number;
  height: number;
}

export interface CoverImage {
  tiny: string;
  large: string;
  small: string;
  original: string;
  meta: Meta2;
}

export interface Meta2 {
  dimensions: Dimensions2;
}

export interface Dimensions2 {
  tiny: Tiny2;
  large: Large2;
  small: Small2;
}

export interface Tiny2 {
  width: number;
  height: number;
}

export interface Large2 {
  width: number;
  height: number;
}

export interface Small2 {
  width: number;
  height: number;
}

export interface Relationships {
  genres: Genres;
  categories: Categories;
  castings: Castings;
  installments: Installments;
  mappings: Mappings;
  reviews: Reviews;
  mediaRelationships: MediaRelationships;
  characters: Characters;
  staff: Staff;
  productions: Productions;
  quotes: Quotes;
  episodes: Episodes;
  streamingLinks: StreamingLinks;
  animeProductions: AnimeProductions;
  animeCharacters: AnimeCharacters;
  animeStaff: AnimeStaff;
}

export interface Genres {
  links: Links2;
}

export interface Links2 {
  self: string;
  related: string;
}

export interface Categories {
  links: Links3;
}

export interface Links3 {
  self: string;
  related: string;
}

export interface Castings {
  links: Links4;
}

export interface Links4 {
  self: string;
  related: string;
}

export interface Installments {
  links: Links5;
}

export interface Links5 {
  self: string;
  related: string;
}

export interface Mappings {
  links: Links6;
}

export interface Links6 {
  self: string;
  related: string;
}

export interface Reviews {
  links: Links7;
}

export interface Links7 {
  self: string;
  related: string;
}

export interface MediaRelationships {
  links: Links8;
}

export interface Links8 {
  self: string;
  related: string;
}

export interface Characters {
  links: Links9;
}

export interface Links9 {
  self: string;
  related: string;
}

export interface Staff {
  links: Links10;
}

export interface Links10 {
  self: string;
  related: string;
}

export interface Productions {
  links: Links11;
}

export interface Links11 {
  self: string;
  related: string;
}

export interface Quotes {
  links: Links12;
}

export interface Links12 {
  self: string;
  related: string;
}

export interface Episodes {
  links: Links13;
}

export interface Links13 {
  self: string;
  related: string;
}

export interface StreamingLinks {
  links: Links14;
}

export interface Links14 {
  self: string;
  related: string;
}

export interface AnimeProductions {
  links: Links15;
}

export interface Links15 {
  self: string;
  related: string;
}

export interface AnimeCharacters {
  links: Links16;
}

export interface Links16 {
  self: string;
  related: string;
}

export interface AnimeStaff {
  links: Links17;
}

export interface Links17 {
  self: string;
  related: string;
}

export interface IKitsuEpisodeCore {
  id: string;
  type: string;
  links: Links;
  attributes: Attributes;
}

export interface IKitsuEpisode {
  data: IKitsuEpisodeCore[];
  meta: {
    count: number;
  };
  links: {
    first?: string;
    next?: string;
    prev?: string;
    last?: string;
  };
}

export interface Links {
  self: string;
}

export interface Attributes {
  createdAt: string;
  updatedAt: string;
  synopsis: string;
  description: string;
  titles: Titles;
  canonicalTitle: string;
  seasonNumber: number;
  number: number;
  relativeNumber: any;
  airdate: string;
  length: number;
  thumbnail: Thumbnail;
}

export interface Titles {
  en: string;
}

export interface Thumbnail {
  original: string;
}
