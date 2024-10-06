export const DOMAIN_URI = `${process.env.NODE_ENV === "production" ? "https" : "http"
  }://${process.env.DOMAIN_URL}`;

export const BASE_URI = DOMAIN_URI + "/api";
export const NEWS_URI = DOMAIN_URI + "/api/news/ann";
export const WAIFU_URI = "https://api.waifu.pics";
export const TMDB_URI = "https://api.themoviedb.org/3";
