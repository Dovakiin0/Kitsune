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
    maxWidth: 345,
    height: "100%",
  },
  media: {
    height: 140,
  },
});

function PopularCard({ img, name, rel }) {
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardActionArea>
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
      <CardActions>
        <Button size="medium" color="default">
          Share
        </Button>
      </CardActions>
    </Card>
  );
}

export default PopularCard;
