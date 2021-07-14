const router = require("express").Router();

const controller = require("../controllers/genre.controller");

router.get("/", controller.getAllGenre);
router.get("/:name/:page", controller.getAnime);

module.exports = router;
