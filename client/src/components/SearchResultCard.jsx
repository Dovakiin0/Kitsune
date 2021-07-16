import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import { useHistory } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    Height: "100px",
    width: "400px",
    padding: "5px",
    "&:hover": {
      opacity: 0.8,
      cursor: "pointer",
    },
  },
  details: {
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: "1 0 auto",
  },
  cover: {
    width: 100,
    height: 100,
  },
  playIcon: {
    height: 38,
    width: 38,
  },
}));

export default function SearchResultCard({ results, handleResetKeyword }) {
  const classes = useStyles();
  const history = useHistory();

  const handleClick = (link) => {
    history.push({
      pathname: `/anime/${link.replace(/\/category\//g, "")}`,
      state: {
        ep: 1,
      },
    });
    handleResetKeyword();
  };

  return (
    <>
      {results.map((search) => (
        <Card className={classes.root} onClick={() => handleClick(search.link)}>
          <CardMedia
            className={classes.cover}
            image={search.img}
            title={search.title}
          />
          <div className={classes.details}>
            <CardContent className={classes.content}>
              <Typography>{search.title}</Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {search.released}
              </Typography>
            </CardContent>
          </div>
        </Card>
      ))}
    </>
  );
}
