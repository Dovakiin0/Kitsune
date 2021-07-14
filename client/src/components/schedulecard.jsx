import React from "react";
import { makeStyles } from "@material-ui/core/styles";
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
  const classes = useStyles();

  return (
    <div className="root">
      <ImageList className={classes.imageList} cols={6}>
        {Anime.map((item) => (
          <>
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
          </>
        ))}
      </ImageList>
    </div>
  );
}

export default ScheduleCard;
