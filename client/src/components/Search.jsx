import React, { useContext, useEffect, useState } from "react";
import { SearchContext } from "../hooks/animecontext";
import { Input, InputGroup, AutoComplete, Loader, Icon } from "rsuite";
import axios from "axios";

const styles = {
  width: 300,
  marginBottom: 10,
  float: "right",
};

function Search() {
  const { keyword, setKeyword } = useContext(SearchContext);
  const [anime, setAnime] = useState();
  const [loading, setLoading] = useState(false);

  const handleClick = (e) => {
    setKeyword(e);
  };

  useEffect(() => {
    let timer = setTimeout(() => getAnime(), 1000);
    return () => clearTimeout(timer);
  }, [keyword]);

  let data = [];
  if (anime) {
    anime.map((d) => data.push(d.name));
  }

  const getAnime = () => {
    if (keyword)
      axios
        .get(`http://localhost:3030/api/v1/anime/${keyword}`, {
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
        {/* <Input placeholder="Search" onChange={handleClick} /> */}
        <InputGroup.Addon>{loading ? <Loader /> : ""}</InputGroup.Addon>
        <AutoComplete data={data} onChange={handleClick} />
        <InputGroup.Addon>
          <Icon icon="search" />
        </InputGroup.Addon>
      </InputGroup>
    </div>
  );
}

export default Search;
