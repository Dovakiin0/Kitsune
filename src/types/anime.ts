export interface IAnime {
    id: string;
    malId: number;
    title: {
        romaji: string;
        english: string;
        native: string;
        userPreferred: string;
    };
    image: string;
    imageHash: string;
    trailer: {
        id: string;
        site: string;
        thumbnail: string;
        thumbnailHash: string;
    };
    description: string;
    status: string;
    cover: string;
    coverHash: string;
    rating: number;
    releaseDate: number;
    color: string;
    genres: string[];
    totalEpisodes: number;
    duration: number;
    type: string;
    episodeTitle?: string,
    episodeId?: string
}
