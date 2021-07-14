import React, { useState, useEffect } from "react";
import { Typography, Grid } from "@material-ui/core";
import axios from "axios";
import PopularCard from "../components/popularCard";

function Homepage() {
  const [popular, setPopular] = useState([]);

  const getPopular = () => {
    axios
      .get("http://localhost:3030/api/v1/anime/popular/fetch/1")
      .then((res) => {
        setPopular(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getPopular();
  }, []);

  return (
    <Grid container spacing={2}>
      {popular.map((anime, index) => (
        <Grid item key={index} xs={12} md={6} lg={3}>
          <PopularCard name={anime.name} img={anime.img} rel={anime.rel} />
        </Grid>
      ))}
    </Grid>
  );
}

export default Homepage;
