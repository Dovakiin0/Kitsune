import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { useState } from "react";

import Homepage from "./pages/homepage";
import AnimeInfo from "./pages/AnimeInfo";
import WatchEpisode from "./pages/WatchEpisode";

import AnimeContext, { SearchContext } from "./hooks/animecontext";

import "rsuite/dist/styles/rsuite-default.css";
import "./App.css";

function App() {
  const [animeContext, setAnimeContext] = useState({
    name: "",
    url: "",
    image: "",
  });

  const [keyword, setKeyword] = useState("");

  return (
    <div className="App">
      <Router>
        <Switch>
          <AnimeContext.Provider value={{ animeContext, setAnimeContext }}>
            <SearchContext.Provider value={{ keyword, setKeyword }}>
              <Route exact path="/" component={Homepage} />
              {/* <Route exact path="/" component={Homepage} />
            <Route exact path="/" component={Homepage} /> */}
            </SearchContext.Provider>
          </AnimeContext.Provider>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
