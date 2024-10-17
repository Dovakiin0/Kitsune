export interface IAnimeDetails {
    id: string;
    title: Title;
    malId: number;
    synonyms: string[];
    isLicensed: boolean;
    isAdult: boolean;
    countryOfOrigin: string;
    trailer: Trailer;
    image: string;
    imageHash: Hash;
    popularity: number;
    color: string;
    cover: string;
    coverHash: Hash;
    description: string;
    status: Status;
    releaseDate: number;
    startDate: EndDateClass;
    endDate: EndDateClass;
    nextAiringEpisode: NextAiringEpisode;
    totalEpisodes: number;
    currentEpisode: number;
    rating: number;
    duration: number;
    genres: string[];
    season: string;
    studios: string[];
    subOrDub: string;
    type: RecommendationType;
    recommendations: Ation[];
    characters: Character[];
    relations: Ation[];
    mappings: Mapping[];
    artwork: Artwork[];
    episodes: Episode[];
}

export interface Artwork {
    img: string;
    type: string;
    providerId: string;
}



export interface Character {
    id: number;
    role: Role;
    name: Name;
    image: string;
    imageHash: Hash;
    voiceActors: VoiceActor[];
}

export enum Hash {
    Hash = "hash",
}

export interface Name {
    first: string;
    last: null | string;
    full: string;
    native: string;
    userPreferred: string;
}

export enum Role {
    Main = "MAIN",
    Supporting = "SUPPORTING",
}

export interface VoiceActor {
    id: number;
    language: Language;
    name: Name;
    image: string;
    imageHash: Hash;
}

export enum Language {
    Japanese = "Japanese",
}

export interface EndDateClass {
    year: number;
    month: number;
    day: number;
}

export interface Episode {
    id: string;
    title: string;
    description: null;
    number: number;
    image: string;
    imageHash: Hash;
    airDate: null;
}

export interface Mapping {
    id: string;
    providerId: string;
    similarity: number;
    providerType: string;
}

export interface NextAiringEpisode {
    airingTime: number;
    timeUntilAiring: number;
    episode: number;
}

export interface Ation {
    id: number;
    malId: number;
    title: Title;
    status: Status;
    episodes: number | null;
    image: string;
    imageHash: Hash;
    cover: string;
    coverHash: Hash;
    rating: number;
    type: RecommendationType;
    relationType?: string;
    color?: string;
}

export enum Status {
    Completed = "Completed",
    Ongoing = "Ongoing",
}

export interface Title {
    romaji: string;
    english: string;
    native: string;
    userPreferred?: string;
}

export enum RecommendationType {
    Manga = "MANGA",
    Novel = "NOVEL",
    Ona = "ONA",
    Tv = "TV",
}

export interface Trailer {
    id: string;
    site: string;
    thumbnail: string;
    thumbnailHash: Hash;
}
