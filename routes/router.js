const express = require("express");
const cors = require("cors");

const anime = require("./anime.routes");

module.exports = (app) => {
  app.use(express.json());
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));

  app.use("/api/v1/anime", anime);
};
