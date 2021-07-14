const router = require("express").Router();

const controller = require("../controllers/schedule.controller");

router.post("/", controller.getSchedule);

module.exports = router;
