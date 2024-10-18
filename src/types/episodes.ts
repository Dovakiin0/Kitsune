export interface IEpisodes {
    headers: Headers;
    sources: Source[];
    download: string;
}

export interface Headers {
    Referer: string;
}

export interface Source {
    url: string;
    isM3U8: boolean;
    quality: string;
}