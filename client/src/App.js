import { ThemeProvider, createTheme, Paper } from "@material-ui/core";
import { useState } from "react";
import Homepage from "./pages/homepage";
import Layout from "./components/layout";

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
          </Switch>
        </Layout>
      </Paper>
    </ThemeProvider>
  );
}

export default App;
