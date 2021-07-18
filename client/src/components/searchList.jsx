import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Paper, Button } from "@material-ui/core";
import SearchResultCard from "./SearchResultCard";

const useStyles = makeStyles((theme) => {
  return {
    root: {
      maxHeight: "400px",
      maxWidth: "500px",
      position: "fixed",
      [theme.breakpoints.down("xs")]: {
        right: 10,
        top: 60,
      },
      right: 80,
      zIndex: 100,
      top: 70,
    },
    paper: {
      width: "100%",
      height: "100%",
    },
    btnMore: {
      bottom: 0,
    },
  };
});

function SearchList({ results, handleResetKeyword }) {
  const classes = useStyles();
  let slicedResults;
  if (results.length !== 0) slicedResults = results.slice(0, 4);
  return (
    <>
      {slicedResults ? (
        <div className={classes.root}>
          <Paper className={classes.paper} elevation={10}>
            <SearchResultCard
              results={slicedResults}
              handleResetKeyword={handleResetKeyword}
            />
          </Paper>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            className={classes.btn}
          >
            See More
          </Button>
        </div>
      ) : (
        ""
      )}
    </>
  );
}

export default SearchList;
