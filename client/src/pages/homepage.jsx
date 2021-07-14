import React, { useState, useEffect, useContext } from "react";
import {
  Typography,
  Grid,
  makeStyles,
  CircularProgress,
} from "@material-ui/core";
import axios from "axios";
import PopularCards from "../components/PopularCards";
import RecentCards from "../components/RecentCards";
import Schedule from "./schedule";
import {
  PopularAnimeContext,
  RecentAnimeContext,
  ScheduleContext,
} from "../context/AnimeContext";

function Homepage() {
  const { popular } = useContext(PopularAnimeContext);
  const { recent } = useContext(RecentAnimeContext);
  const { schedule } = useContext(ScheduleContext);

  const useStyles = makeStyles({
    spinner: {
      position: "fixed",
      top: "50%",
      left: "50%",
    },
    title: {
      padding: "10px",
    },
  });

  const classes = useStyles();
  return (
    <div>
      <Grid container spacing={2}>
        <Grid xs={12}>
          <Typography className={classes.title} variant="h5">
            Most Popular Anime
          </Typography>
        </Grid>

        {popular ? (
          <PopularCards Anime={popular} />
        ) : (
          <CircularProgress className={classes.spinner} color="secondary" />
        )}
        <Grid xs={12}>
          <Typography className={classes.title} variant="h5">
            Most Recent Anime
          </Typography>
          {recent ? (
            <RecentCards Anime={recent} />
          ) : (
            <CircularProgress className={classes.spinner} color="secondary" />
          )}
        </Grid>
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
