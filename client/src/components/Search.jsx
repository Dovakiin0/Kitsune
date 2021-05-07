import React, { useContext, useEffect, useState } from "react";
import AnimeContext, { SearchContext } from "../hooks/animecontext";
import { InputGroup, AutoComplete, Loader, Icon } from "rsuite";
import { Link } from "react-router-dom";
import axios from "axios";
import _ from "lodash";

const styles = {
  width: 300,
  marginBottom: 10,
  float: "right",
};

function Search(props) {
  const { keyword, setKeyword } = useContext(SearchContext);
  const [anime, setAnime] = useState();
  const [loading, setLoading] = useState(false);
  const { animeContext, setAnimeContext } = useContext(AnimeContext);

  const handleClick = (e) => {
    setKeyword(e);
  };

  const handleSelect = (val) => {
    const value = _.find(anime, function (anim) {
      return anim.name == val.value;
    });
    setAnimeContext({ name: value.name, url: value.url });
    props.history.push(`/anime/${value.name.replace(/\s/g, "-")}`);
  };

  useEffect(() => {
    let timer = setTimeout(() => getAnime(), 1000);
    return () => clearTimeout(timer);
  }, [keyword]);

  const getAnime = () => {
    if (keyword)
      axios
        .get(`${process.env.REACT_APP_API_URI}/anime/${keyword}`, {
          onDownloadProgress: setLoading(true),
        })
        .then((response) => {
          setAnime(response.data);
          setLoading(false);
        })
        .catch((err) => console.log(err));
  };

  return (
    <div>
      <InputGroup style={styles}>
        <InputGroup.Addon>{loading ? <Loader /> : ""}</InputGroup.Addon>
        <AutoComplete
          data={anime ? anime.map((data) => data.name) : ""}
          onChange={handleClick}
          onSelect={handleSelect}
          filterBy={(value, item) => item}
        />
        <InputGroup.Addon>
          <Icon icon="search" />
        </InputGroup.Addon>
      </InputGroup>
    </div>
  );
}

export default Search;
