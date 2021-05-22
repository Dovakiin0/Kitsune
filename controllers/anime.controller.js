const AnimeScraper = require("ctk-anime-scraper");
const Anime = new AnimeScraper.Gogoanime();
const cheerio = require("cheerio");
const { default: axios } = require("axios");

module.exports = {
  getPopular: async (req, res) => {
    try {
      let animes = [];
      const { data } = await axios.get(
        `https://www1.gogoanime.ai/popular.html?page=${req.params.id}`
      );
      const $ = cheerio.load(data);
      $(".items")
        .children("li")
        .each(function (index, elem) {
          let img = $(this)
            .children(".img")
            .children("a")
            .children("img")
            .attr("src");

          let name = $(this).children(".name").text();
          let rel = $(this).children(".released").text();
          animes.push({ img, name, rel });
        });
      res.status(200).send(animes);
    } catch (err) {
      res.status(400).send(err);
    }
  },
  getRecent: async (req, res) => {
    try {
      let animes = [];
      const { data } = await axios.get(
        `https://www1.gogoanime.ai/?page=${req.params.id}`
      );
      const $ = cheerio.load(data);
      $(".items")
        .children("li")
        .each(function (index, elem) {
          let img = $(this)
            .children(".img")
            .children("a")
            .children("img")
            .attr("src");

          let name = $(this).children(".name").text();
          let ep = $(this).children(".episode").text();
          animes.push({ img, name, ep });
        });
      res.status(200).send(animes);
    } catch (err) {
      res.status(400).send(err);
    }
  },

  getAnime: (req, res) => {
    try {
      const animeName = req.params.name;
      Anime.search(animeName)
        .then((anime) => {
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
      Anime.fetchAnime(uri)
        .then((result) => res.status(200).send({ result }))
        .catch((err) => console.log(err));
    } catch (err) {
      res.status(400).send(err);
    }
  },

  getAnimeEpisodes: (req, res) => {
    try {
      Anime.getEpisodes(req.body.slug, req.params.ep)
        .then((episode) => res.status(200).send(episode))
        .catch((err) => console.log(err));
    } catch (err) {
      res.status(400).send(err);
    }
  },

  random: (req, res) => {
    try {
      axios
        .post(`https://api.waifu.pics/many/sfw/${req.params.key}`, {})
        .then((resp) => res.status(200).send(resp.data))
        .catch((err) => console.log(err));
    } catch (err) {
      return res.status(400).send(err);
    }
  },
};
