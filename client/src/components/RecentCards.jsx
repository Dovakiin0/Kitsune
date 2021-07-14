import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
} from "@material-ui/core";
import { PlayArrowOutlined } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
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
}));

function RecentCards({ Anime }) {
  const classes = useStyles();

  return (
    <div className={"root"}>
      <ImageList className={classes.imageList} cols={5}>
        {Anime.map((item) => (
          <ImageListItem
            key={item.img}
            style={{ height: 400, padding: "12px" }}
          >
            <img src={item.img} alt={item.name} />
            <ImageListItemBar
              title={item.name}
              subtitle={item.recent_episode}
              classes={{
                root: classes.titleBar,
                title: classes.title,
              }}
              actionIcon={
                <IconButton aria-label={`star ${item.name}`}>
                  <PlayArrowOutlined className={classes.title} />
                </IconButton>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>
    </div>
  );
}

export default RecentCards;
