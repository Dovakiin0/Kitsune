export let BASE_URI = "https://api.consumet.org";
export let ANIME_URI = BASE_URI + "/anime/gogoanime";
export let NEWS_URI = BASE_URI + "/news/ann";
export let WAIFU_URI = "https://api.waifu.pics";
export let KITSU_URI = "https://kitsu.io/api/edge";

export let DOMAIN_URL = `${process.env.NODE_ENV === "production" ? "https" : "http"
  }://${process.env.VERCEL_URL}`;
