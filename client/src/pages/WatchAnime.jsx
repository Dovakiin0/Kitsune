import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CircularProgress, Typography, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Iframe from "react-iframe";

const useStyles = makeStyles({
  container: {
    position: "relative",
    height: "400px",
    maxWidth: "100vw",
  },
  image: {
    position: "absolute",
    marginRight: "auto",
    width: "100%",
    maxHeight: "100%",
    filter: "blur(90px)",
  },
  animeInfoCover: {
    position: "absolute",
    width: "70%",
  },
  cover: {
    position: "absolute",
    maxHeight: "350px",
    maxWidth: "450px",
    marginTop: "30px",
    marginLeft: "17%",
    objectFit: "cover",
  },
  title: {
    position: "absolute",
    marginLeft: "30%",
    marginTop: "40px",
  },
  detail: {
    position: "absolute",
    marginLeft: "30%",
    marginTop: "70px",
  },
  episode: {
    textAlign: "center",
  },
});

function WatchAnime() {
  const [animeInfo, setAnimeInfo] = useState();
  const [loading, setLoading] = useState(false);
  const { slug, ep } = useParams();

  const classes = useStyles();

  if (ep) console.log(ep);

  const getAnime = () => {
    axios
      .post(
        "http://localhost:3030/api/v1/anime",
        { uri: "/category/" + slug },
        { onDownloadProgress: setLoading(true) }
      )
      .then((res) => {
        setLoading(false);
        setAnimeInfo(res.data);
      })
      .catch((err) => console.log(err));
  };

  const getEpisodes = () => {};

  useEffect(() => {
    getAnime();
  }, [slug]);

  return (
    <Paper style={{ maxWidth: "100vw", maxHeight: "200vh" }}>
      <div className={classes.container}>
        {loading ? (
          <CircularProgress style={{ margin: "auto" }} color="secondary" />
        ) : animeInfo ? (
          <>
            <img className={classes.image} src={animeInfo.img} />
            <div className={classes.animeInfoCover}>
              <img className={classes.cover} src={animeInfo.img} />
            </div>
            <Typography variant="h5" className={classes.title}>
              {animeInfo.title}
            </Typography>
            <Typography className={classes.detail}>
              <span style={{ fontStyle: "italic" }}>
                <span style={{ fontWeight: "bold" }}>Other Names:</span>
                {animeInfo.other_name} <br />
              </span>
              {animeInfo.plot_summary} <br />
              <span style={{ fontWeight: "bold" }}>Genre: </span>
              {animeInfo.genre.join(", ")} <br />
              <span style={{ fontWeight: "bold" }}>Released: </span>
              {animeInfo.released} <br />
              <span style={{ fontWeight: "bold" }}>Status: </span>
              {animeInfo.status} <br />
              <span style={{ fontWeight: "bold" }}>Type: </span>
              {animeInfo.type} <br />
            </Typography>
          </>
        ) : (
          ""
        )}
      </div>
      <div className={classes.episode}>
        <br />
        <Typography variant="h4">Watch </Typography>
        <br />
        <Iframe
          url="http://www.youtube.com/embed/xDMP3i36naA"
          // sandbox={
          //   "allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
          // }
          width="1000px"
          height="600px"
          id="myId"
          className="myClassname"
          display="initial"
          position="relative"
          styles={{
            padding: "10px",
          }}
        />
      </div>
    </Paper>
  );
}
export default WatchAnime;
