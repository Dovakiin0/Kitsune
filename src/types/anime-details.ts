export interface IAnimeDetails {
    anime: Anime;
    seasons: unknown[];
    mostPopularAnimes: unknown[];
    relatedAnimes: RelatedAnime[];
    recommendedAnimes: RecommendedAnime[];
}

export interface Anime {
    info: Info;
    moreInfo: MoreInfo;
}

export interface Info {
    id: string;
    anilistId: number;
    malId: number;
    name: string;
    poster: string;
    description: string;
    stats: Stats;
    promotionalVideos: unknown[];
    charactersVoiceActors: unknown[];
}

export interface Stats {
    rating: string;
    quality: string;
    episodes: Episodes;
    type: Type;
    duration: string;
}

export interface Episodes {
    sub: number;
    dub: number | null;
}

export enum Type {
    Tv = "TV",
}

export interface MoreInfo {
    japanese: string;
    synonyms: string;
    aired: string;
    premiered: string;
    duration: string;
    status: string;
    malscore: string;
    genres: string[];
    studios: string;
    producers: string[];
}

export interface RecommendedAnime {
    id: string;
    name: string;
    jname: string;
    poster: string;
    duration: string;
    type: string;
    rating: null | string;
    episodes: Episodes;
}

export interface RelatedAnime {
    id: string;
    name: string;
    jname: string;
    poster: string;
    episodes: Episodes;
    type: Type;
}
