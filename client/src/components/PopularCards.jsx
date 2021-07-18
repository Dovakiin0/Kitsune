import React from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import {
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
} from "@material-ui/core";
import { PlayArrowOutlined } from "@material-ui/icons";
import ModalAnime from "./ModalAnime";
import axios from "axios";
import { useHistory } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
    height: "330px",
  },
  imageList: {
    flexWrap: "nowrap",
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: "translateZ(0)",
  },
  title: {
    color: theme.palette.default,
  },
  titleBar: {
    background:
      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
  },
  img: {
    "&:hover": {
      opacity: 0.8,
      transform: "scale(1.1)",
      cursor: "pointer",
    },
  },
}));

function PopularCards({ Anime }) {
  const theme = useTheme();
  const two_cards = useMediaQuery(theme.breakpoints.down("xs"));
  const three_cards = useMediaQuery(theme.breakpoints.down("sm"));
  const four_cards = useMediaQuery(theme.breakpoints.down("md"));

  let temp_col;
  if (two_cards) {
    temp_col = 2;
  } else if (three_cards) {
    temp_col = 3;
  } else if (four_cards) {
    temp_col = 4;
  } else {
    temp_col = 6;
  }

  const classes = useStyles();
  const history = useHistory();

  const [selectedAnime, setSelectedAnime] = React.useState(null);
  const [openDialog, setOpenDialog] = React.useState(false);

  const handleOpen = (item) => {
    getAnime(item.link);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedAnime(null);
  };

  const handleWatchClick = (slug) => {
    setOpenDialog(false);
    history.push({
      pathname: `/anime/${slug}`,
    });
  };

  const getAnime = (link) => {
    axios
      .post("/api/v1/anime", { uri: link })
      .then((res) => {
        setSelectedAnime(res.data);
      })
      .catch((err) => console.log(err));
  };

  const handleToEpisode = (item) => {
    setOpenDialog(false);
    history.push({
      pathname: `/anime/${item.link.replace(/\/category\//g, "")}`,
    });
  };

  return (
    <div className={classes.root}>
      {Anime.length !== 0 ? (
        <ImageList className={classes.imageList} cols={temp_col}>
          {Anime.map((item) => (
            <ImageListItem
              key={item.img}
              className={classes.img}
              style={{ height: "300px", padding: "12px" }}
            >
              <img
                src={item.img}
                alt={item.name}
                onClick={() => handleOpen(item)}
              />
              <ImageListItemBar
                title={item.name}
                subtitle={item.release}
                classes={{
                  root: classes.titleBar,
                  title: classes.title,
                }}
                actionIcon={
                  <IconButton onClick={() => handleToEpisode(item)}>
                    <PlayArrowOutlined className={classes.title} />
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
          {selectedAnime !== null ? (
            <ModalAnime
              isOpen={openDialog}
              handleWatchClick={handleWatchClick}
              data={selectedAnime}
              handleClose={handleClose}
            />
          ) : (
            ""
          )}
        </ImageList>
      ) : (
        <div style={{ height: 400 }} />
      )}
    </div>
  );
}

export default PopularCards;
