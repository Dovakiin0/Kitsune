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
import { PlayArrowOutlined } from "@material-ui/icons";

const useStyles = makeStyles({
  root: {
    maxWidth: 400,
    height: "100%",
  },
  media: {
    height: 200,
  },
});

function ScheduleCard({ img, name, epi, airing }) {
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
            Airing on: {airing}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size="medium" color="default" endIcon={<PlayArrowOutlined />}>
          Episode {epi}
        </Button>
      </CardActions>
    </Card>
  );
}

export default ScheduleCard;
