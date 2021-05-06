import React, { useState } from "react";
import NavHeader from "../components/header";
import Search from "../components/Search";

function Homepage(props) {
  const [activeKey, setActiveKey] = useState();

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  return (
    <div>
      <NavHeader activekey={activeKey} onSelect={handleSelect} />
      <Search {...props} />
      Search for anime to get started
    </div>
  );
}

export default Homepage;
