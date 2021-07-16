import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  CircularProgress,
  Typography,
  Paper,
  Divider,
  Button,
} from "@material-ui/core";
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
  epList: {
    textAlign: "center",
    marginLeft: "20%",
    width: "50vw",
    maxHeight: "400px",
    overflowY: "scroll",
  },

  episodeButton: {
    width: "120px",
  },
});

function WatchAnime(props) {
  let [ep, setEp] = useState(1);
  const [animeInfo, setAnimeInfo] = useState();
  const [loading, setLoading] = useState(false);
  const { slug } = useParams();
  const [episodes, setEpisodes] = useState();
  const [links, setLinks] = useState();

  const classes = useStyles();

  const getAnime = () => {
    axios
      .post(
        "/api/v1/anime",
        { uri: "/category/" + slug },
        { onDownloadProgress: setLoading(true) }
      )
      .then((res) => {
        setLoading(false);
        setAnimeInfo(res.data);
      })
      .catch((err) => console.log(err));
  };

  const handleEpClick = (epi) => {
    setEp(epi);
  };

  const getEpisodes = () => {
    axios
      .post("/api/v1/anime/episode", {
        slug,
        ep,
      })
      .then((episode) => {
        setEpisodes(episode.data);
        setLinks(episode.data.links);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getAnime();
    if (props.location.state) {
      setEp(parseInt(props.location.state.ep));
    }
  }, [slug]);

  useEffect(() => {
    getEpisodes();
  }, [ep]);

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
      {episodes ? (
        <>
          <div className={classes.episode}>
            <br />
            <Typography variant="h4">
              Watch {episodes.name} Episode {episodes.episode}
            </Typography>
            <br />
            <Iframe
              url={links ? links[0].link : ""}
              sandbox="allow-same-origin allow-scripts allow-top-navigation"
              width="1200px"
              height="700px"
              id="myId"
              className="myClassname"
              display="initial"
              position="relative"
              frameBorder="0"
              gesture="media"
              allow="fullscreen"
              scrolling="no"
              styles={{
                padding: "10px",
              }}
            />
            <Typography>
              Please{" "}
              <a
                href=""
                onClick={() => window.location.reload()}
                style={{ textDecoration: "None", color: "lightcoral" }}
              >
                Reload
              </a>{" "}
              if the video is not loading
            </Typography>
          </div>
          <Divider />
          <Typography variant="h4" style={{ textAlign: "center" }}>
            Episodes
          </Typography>
          <div className={classes.epList}>
            {animeInfo
              ? [...Array(parseInt(animeInfo.episode_count))].map((e, i) => (
                  <Button
                    variant={ep === i + 1 ? "contained" : "outlined"}
                    color={ep === i + 1 ? "secondary" : ""}
                    className={classes.episodeButton}
                    onClick={() => handleEpClick(i + 1)}
                  >
                    Episode {i + 1}
                  </Button>
                ))
              : ""}
          </div>
        </>
      ) : (
        ""
      )}
    </Paper>
  );
}
export default WatchAnime;
