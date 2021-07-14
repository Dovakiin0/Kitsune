import { ThemeProvider, createTheme, Paper } from "@material-ui/core";
import { useState, useEffect } from "react";
import Homepage from "./pages/homepage";
import Layout from "./components/layout";
import { Route, Switch } from "react-router-dom";
import axios from "axios";
import {
  ScheduleContext,
  PopularAnimeContext,
  DarkModeContext,
} from "./context/AnimeContext";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [schedule, setSchedule] = useState({});

  const [popular, setPopular] = useState([]);

  const darkTheme = createTheme({
    palette: {
      type: darkMode ? "dark" : "light",
    },
  });

  useEffect(() => {
    getSchedule();
    getPopular();
  }, []);

  const getPopular = () => {
    axios
      .get("http://localhost:3030/api/v1/anime/popular/1", {})
      .then((res) => {
        setPopular(res.data);
      })
      .catch((err) => console.log(err));
  };

  const getSchedule = () => {
    axios
      .post("http://localhost:3030/api/v1/schedule", { day: "" })
      .then((sche) => {
        setSchedule(sche.data);
      })
      .catch((err) => console.log(err));
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Paper>
        <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
          <ScheduleContext.Provider value={{ schedule }}>
            <PopularAnimeContext.Provider value={{ popular }}>
              <Layout>
                <Switch>
                  <Route exact path="/" component={Homepage} />
                </Switch>
              </Layout>
            </PopularAnimeContext.Provider>
          </ScheduleContext.Provider>
        </DarkModeContext.Provider>
      </Paper>
    </ThemeProvider>
  );
}

export default App;
