const router = require("express").Router();

const controller = require("../controllers/anime.controller");

router.get("/:name", controller.getAnime);
router.post("/", controller.getAnimeDetails);
router.post("/episode", controller.getAnimeEpisodes);
router.get("/recent/:page", controller.getRecent);
router.get("/popular/:page", controller.getPopular);

module.exports = router;
