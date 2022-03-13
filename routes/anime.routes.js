const router = require("express").Router();

const apiCache = require("apicache");

const cache = apiCache.middleware;

const controller = require("../controllers/anime.controller");

router.get("/:name", controller.getAnime);
router.post("/", controller.getAnimeDetails);
router.post("/episode", controller.getAnimeEpisodes);
router.post("/episode-fix", controller.getEpisodeFix);
router.get("/recent/:page", cache("5 minutes"), controller.getRecent);
router.get("/popular/:page", cache("5 minutes"), controller.getPopular);

module.exports = router;
