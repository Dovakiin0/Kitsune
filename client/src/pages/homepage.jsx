import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import { List, Icon, Loader, IconButton } from "rsuite";
import axios from "axios";
import AnimeContext, { SearchContext } from "../hooks/animecontext";
import Search from "../components/Search";

function Homepage() {
  const [activeKey, setActiveKey] = useState();
  const { animeContext, setAnimeContext } = useContext(AnimeContext);
  const { keyword } = useContext(SearchContext);

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  return (
    <div>
      <NavHeader activekey={activeKey} onSelect={handleSelect} />
      <Search />
    </div>
  );
}

export default Homepage;
