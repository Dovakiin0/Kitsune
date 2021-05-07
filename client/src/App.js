import { BrowserRouter as Router, Switch } from "react-router-dom";
import { useState } from "react";
import Route from "./service/Route";

import Homepage from "./pages/homepage";
import AnimeInfo from "./pages/AnimeInfo";
import WatchEpisode from "./pages/WatchEpisode";
import Latest from "./pages/Latest";
import Popular from "./pages/Popular";

import AnimeContext, { SearchContext, InfoContext } from "./hooks/animecontext";

import "rsuite/dist/styles/rsuite-default.css";
import "./App.css";

function App() {
  const [animeContext, setAnimeContext] = useState({
    name: "",
    url: "",
  });

  const [keyword, setKeyword] = useState("");
  const [info, setInfo] = useState();

  return (
    <div className="App">
      <Router>
        <Switch>
          <AnimeContext.Provider value={{ animeContext, setAnimeContext }}>
            <SearchContext.Provider value={{ keyword, setKeyword }}>
              <InfoContext.Provider value={{ info, setInfo }}>
                <Route exact path="/" component={Homepage} />
                <Route exact path="/latest" component={Latest} />
                <Route exact path="/popular" component={Popular} />
                <Route exact path="/anime/:name" component={AnimeInfo} />
                <Route exact path="/anime/:name/:ep" component={WatchEpisode} />
              </InfoContext.Provider>
            </SearchContext.Provider>
          </AnimeContext.Provider>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
