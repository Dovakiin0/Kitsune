const router = require("express").Router();

const controller = require("../controllers/anime.controller");

router.get("/:name", controller.getAnime);
router.post("/", controller.getAnimeDetails);
router.post("/episode/:id", controller.getAnimeEpisodes);

module.exports = router;
