export let DOMAIN_URI = `${process.env.NODE_ENV === "production" ? "https" : "http"
  }://${process.env.DOMAIN_URL}`;

export let BASE_URI = DOMAIN_URI + "/api";
export let NEWS_URI = DOMAIN_URI + "/api/news/ann";
export let WAIFU_URI = "https://api.waifu.pics";
export let TMDB_URI = "https://api.themoviedb.org/3";
