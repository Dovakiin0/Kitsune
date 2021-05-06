import React from "react";
import { Route as Ro } from "react-router-dom";

function Route({ Component, ...rest }) {
  return <Ro {...rest} render={(props) => <Component {...props} />} />;
}

export default Route;
