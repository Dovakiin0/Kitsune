import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Homepage from "./pages/homepage";
import "rsuite/dist/styles/rsuite-default.css";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={Homepage} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
