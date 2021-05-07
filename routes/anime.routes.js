const router = require("express").Router();

const controller = require("../controllers/anime.controller");

router.get("/:name", controller.getAnime);
router.post("/", controller.getAnimeDetails);
router.post("/episode/:id", controller.getAnimeEpisodes);
router.get("/page/:id", controller.getRecent);
router.get("/popular/fetch/:id", controller.getPopular);
router.post("/random/keyword/:key", controller.random);

module.exports = router;
