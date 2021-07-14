const { AnimeData } = require("@dovakiin0/anime-data");

const Genre = new AnimeData();

module.exports = {
  getAllGenre: (req, res) => {
    Genre.getAllGenre()
      .then((genres) => {
        res.status(200).send(genres);
      })
      .catch((err) => res.status(500).send(err));
  },

  getAnime: (req, res) => {
    Genre.getAnimeGenre(req.params.name, req.params.page)
      .then((animes) => {
        res.status(200).send(animes);
      })
      .catch((err) => res.status(500).send(err));
  },
};
