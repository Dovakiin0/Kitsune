import React, { useContext, useEffect, useState } from "react";
import AnimeContext, { SearchContext } from "../hooks/animecontext";
import { InputGroup, AutoComplete, Loader, Icon } from "rsuite";
import axios from "axios";
import _ from "lodash";

const styles = {
  width: 300,
  marginBottom: 10,
  // position: "fixed",
};

function Search(props) {
  const { keyword, setKeyword } = useContext(SearchContext);
  const [anime, setAnime] = useState();
  const [loading, setLoading] = useState(false);
  const { setAnimeContext } = useContext(AnimeContext);

  const handleClick = (e) => {
    setKeyword(e);
  };

  const handleSelect = (val) => {
    const value = _.find(anime, function (anim) {
      return anim.title == val.value;
    });
    setAnimeContext({ name: value.title, url: value.link });
    props.history.push(`/anime/${value.title.replace(/\s/g, "-")}`);
  };

  useEffect(() => {
    let timer = setTimeout(() => getAnime(), 1000);
    return () => clearTimeout(timer);
  }, [keyword]);

  const getAnime = () => {
    if (keyword)
      axios
        .get(`/api/v1/anime/${keyword}`, {
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
          data={anime ? anime.map((data) => data.title) : ""}
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
