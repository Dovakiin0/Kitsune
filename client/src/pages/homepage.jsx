import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";

function Homepage(props) {
  const [activeKey, setActiveKey] = useState();

  const handleSelect = (event) => {
    setActiveKey(event);
  };
  return (
    <div style={{ padding: "10px" }}>
      <NavHeader activekey={activeKey} onSelect={handleSelect} {...props} />
      Welcome to Anime Watch
    </div>
  );
}

export default Homepage;
