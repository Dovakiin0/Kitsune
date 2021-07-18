import React from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import {
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Button,
} from "@material-ui/core";

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

function ScheduleCard({ Anime }) {
  const theme = useTheme();
  const classes = useStyles();

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

  return (
    <div className="root">
      <ImageList className={classes.imageList} cols={temp_col}>
        {Anime.map((item) => (
          <ImageListItem
            key={item.img}
            style={{ height: 300, padding: "12px" }}
          >
            <img src={item.img} alt={item.name} />
            <ImageListItemBar
              title={item.title}
              subtitle={`Airing: ${new Date(
                item.airing_time
              ).toLocaleTimeString()}`}
              classes={{
                root: classes.titleBar,
                title: classes.title,
              }}
              actionIcon={<Button>{`Ep ${item.episode}`}</Button>}
            />
          </ImageListItem>
        ))}
      </ImageList>
    </div>
  );
}

export default ScheduleCard;
