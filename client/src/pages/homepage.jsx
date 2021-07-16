import React, { useContext, useEffect, useState } from "react";
import { Typography, Grid, makeStyles } from "@material-ui/core";
import PopularCards from "../components/PopularCards";
import RecentCards from "../components/RecentCards";
import Schedule from "./schedule";
import { PopularAnimeContext, ScheduleContext } from "../context/AnimeContext";
import axios from "axios";

function Homepage() {
  const { popular } = useContext(PopularAnimeContext);
  const [recent, setRecent] = useState([]);
  const { schedule } = useContext(ScheduleContext);

  const useStyles = makeStyles({
    root: {
      maxWidth: "100vw",
    },
    title: {
      padding: "10px",
      flexGrow: 1,
    },
    grids: {
      display: "flex",
    },
    spinner: {
      padding: "5px",
    },
  });

  const getRecent = () => {
    axios
      .get("/api/v1/anime/recent/1", {})
      .then((res) => {
        setRecent(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getRecent();
  }, []);

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Grid item container spacing={2}>
        <Grid item xs={12} className={classes.grids}>
          <Typography className={classes.title} variant="h5">
            Most Popular Anime
          </Typography>
        </Grid>
        <PopularCards Anime={popular} />
        <Grid item xs={12} className={classes.grids}>
          <Typography className={classes.title} variant="h5">
            Most Recent Anime
          </Typography>
        </Grid>
        <RecentCards Anime={recent} />
        <Grid item xs={12}>
          <Typography className={classes.title} variant="h5">
            Schedule
          </Typography>
          <Schedule schedule={schedule} />
        </Grid>
      </Grid>
    </div>
  );
}

export default Homepage;
