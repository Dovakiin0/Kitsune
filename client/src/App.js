import { ThemeProvider, createTheme, Paper } from "@material-ui/core";
import { useState } from "react";
import Homepage from "./pages/homepage";
import Layout from "./components/layout";
import Recent from "./pages/recent";
import Schedule from "./pages/schedule";
import { Route, Switch } from "react-router-dom";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const darkTheme = createTheme({
    palette: {
      type: darkMode ? "dark" : "light",
    },
  });

  const handleChange = (value) => {
    setDarkMode(value);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Paper>
        <Layout onChange={handleChange}>
          <Switch>
            <Route exact path="/" component={Homepage} />
            <Route exact path="/recent" component={Recent} />
            <Route exact path="/schedule" component={Schedule} />
          </Switch>
        </Layout>
      </Paper>
    </ThemeProvider>
  );
}

export default App;
