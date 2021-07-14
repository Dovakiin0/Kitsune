const { AnimeSchedule } = require("@dovakiin0/anime-data");

const Schedule = new AnimeSchedule();

module.exports = {
  getSchedule: (req, res) => {
    Schedule.getSchedule(req.body.day)
      .then((schedule) => {
        res.status(200).send(schedule);
      })
      .catch((err) => res.status(500).send(err));
  },
};
