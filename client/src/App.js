import { BrowserRouter as Router, Switch } from "react-router-dom";
import { useState } from "react";
import Route from "./service/Route";

import Homepage from "./pages/homepage";
import AnimeInfo from "./pages/AnimeInfo";
import WatchEpisode from "./pages/WatchEpisode";

import AnimeContext, {
  SearchContext,
  EpisodeContext,
} from "./hooks/animecontext";

import "rsuite/dist/styles/rsuite-default.css";
import "./App.css";

function App() {
  const [animeContext, setAnimeContext] = useState({
    name: "",
    url: "",
  });

  const [keyword, setKeyword] = useState("");
  const [episodeUrl, setEpisodeUrl] = useState("");

  return (
    <div className="App">
      <Router>
        <Switch>
          <AnimeContext.Provider value={{ animeContext, setAnimeContext }}>
            <SearchContext.Provider value={{ keyword, setKeyword }}>
              <EpisodeContext.Provider value={{ episodeUrl, setEpisodeUrl }}>
                <Route exact path="/" component={Homepage} />
                <Route exact path="/:name" component={AnimeInfo} />
                <Route exact path="/" component={WatchEpisode} />
              </EpisodeContext.Provider>
            </SearchContext.Provider>
          </AnimeContext.Provider>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
