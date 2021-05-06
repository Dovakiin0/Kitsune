const { Anime } = require("anime-scraper");
const cheerio = require("cheerio");
const { default: axios } = require("axios");

const getImage = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const imagesrc = $(".anime_info_body_bg").children("img").attr("src");
    return imagesrc;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getAnime: (req, res) => {
    try {
      const animeName = req.params.name;
      Anime.search(animeName)
        .then(async (anime) => {
          res.status(200).send(anime);
        })
        .catch((err) => res.status(400).send(err));
    } catch (err) {
      return res.status(400).send(err);
    }
  },

  getAnimeDetails: async (req, res) => {
    try {
      const uri = req.body.uri;
      const image = await getImage(uri);
      Anime.fromUrl(uri)
        .then((result) => res.status(200).send({ image, result }))
        .catch((err) => console.log(err));
    } catch (err) {
      res.status(400).send(err);
    }
  },

  getAnimeEpisodes: (req, res) => {
    try {
      Anime.fromUrl(req.body.uri)
        .then((anime) =>
          anime.episodes[req.params.id]
            .fetch()
            .then((episode) => res.status(200).send(episode))
        )
        .catch((err) => console.log(err));
    } catch (err) {
      res.status(400).send(err);
    }
  },
};
