export interface IEpisodes {
    totalEpisodes: number;
    episodes: Episode[];
}

export interface Episode {
    title: string;
    episodeId: string;
    number: number;
    isFiller: boolean;
}
