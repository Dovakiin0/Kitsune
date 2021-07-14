import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Button,
  CardActionArea,
  Typography,
  CardActions,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  root: {
    maxWidth: 500,
    height: "100%",
  },
  media: {
    height: 200,
  },
});

function PopularCard({ img, name, rel }) {
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardActionArea style={{ height: "100%" }}>
        <CardMedia className={classes.media} image={img} title={name} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {name}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {rel}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default PopularCard;
