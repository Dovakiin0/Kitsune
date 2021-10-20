const express = require("express");
const cors = require("cors");

const anime = require("./anime.routes");
const genre = require("./genre.routes");
const schedule = require("./schedule.routes");

const apiCache = require("apicache");

const cache = apiCache.middleware;

module.exports = (app) => {
  app.use(express.json());
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));

  app.use("/api/v1/anime", anime);
  app.use("/api/v1/genre", cache("5 minutes"), genre);
  app.use("/api/v1/schedule", cache("5 minutes"), schedule);
};
