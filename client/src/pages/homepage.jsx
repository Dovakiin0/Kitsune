import React, { useContext, useEffect, useState } from "react";
import {
  Typography,
  Grid,
  makeStyles,
  CircularProgress,
} from "@material-ui/core";
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
      <Grid container spacing={2}>
        <Grid xs={12} className={classes.grids}>
          <Typography className={classes.title} variant="h5">
            Most Popular Anime
          </Typography>
          {popular.length !== 0 ? (
            ""
          ) : (
            <CircularProgress className={classes.spinner} color="secondary" />
          )}
        </Grid>
        <PopularCards Anime={popular} />
        <Grid xs={12} className={classes.grids}>
          <Typography className={classes.title} variant="h5">
            Most Recent Anime
          </Typography>
          {recent.length !== 0 ? (
            ""
          ) : (
            <CircularProgress className={classes.spinner} color="secondary" />
          )}
        </Grid>
        <RecentCards Anime={recent} />
        <Grid xs={12}>
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
