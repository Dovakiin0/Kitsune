import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import { Fab, Select, MenuItem } from "@material-ui/core";
import { RefreshRounded } from "@material-ui/icons";
import Gallery from "react-photo-gallery";

const useStyles = makeStyles((theme) => ({
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(4),
  },
  select: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(13),
    width: "150px",
  },
}));

function Waifu() {
  const listInnerRef = useRef(null);
  const [picsList, setPicsList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [keyword, setKeyword] = useState("waifu");
  const classes = useStyles();

  const getWaifuPics = () => {
    axios
      .post(`https://api.waifu.pics/many/sfw/${keyword}`, {})
      .then((res) => setPicsList(res.data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getWaifuPics();
  }, [refreshKey, keyword]);

  let temp = [];
  if (picsList.length !== 0) {
    picsList.files.map((img) => {
      temp.push({
        src: img,
        width: 4,
        height: 4,
      });
    });
  }

  const handleChange = (event) => {
    setKeyword(event.target.value);
  };

  const onScroll = () => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current;
      if (scrollTop + clientHeight === scrollHeight) {
        console.log("reached bottom");
      }
    }
  };

  return (
    <div className={classes.root} ref={listInnerRef} onScroll={onScroll}>
      <Gallery photos={temp ? temp : ""} />
      <Select
        value={keyword}
        onChange={handleChange}
        className={classes.select}
        color="secondary"
        variant="outlined"
        autoFocus={true}
      >
        <MenuItem value={"waifu"}>Waifu</MenuItem>
        <MenuItem value={"neko"}>Neko</MenuItem>
        <MenuItem value={"megumin"}>Megumin</MenuItem>
        <MenuItem value={"cuddle"}>Cuddle</MenuItem>
        <MenuItem value={"pat"}>Pat</MenuItem>
        <MenuItem value={"slap"}>Slap</MenuItem>
        <MenuItem value={"dance"}>Dance</MenuItem>
      </Select>
      <Fab
        color="secondary"
        aria-label="refresh"
        className={classes.fab}
        onClick={() => setRefreshKey((prev) => prev + 1)}
      >
        <RefreshRounded />
      </Fab>
    </div>
  );
}

export default Waifu;
