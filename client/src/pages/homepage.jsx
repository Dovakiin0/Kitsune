import React, { useState, useEffect } from "react";
import NavHeader from "../components/header";
import { Panel, Input, InputGroup, Icon, Loader } from "rsuite";
import axios from "axios";

const styles = {
  width: 300,
  marginBottom: 10,
};

function Homepage() {
  const [activeKey, setActiveKey] = useState();
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [animes, setAnime] = useState();

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  useEffect(() => {
    getAnime();
  }, [keyword]);

  const getAnime = () => {
    if (keyword)
      axios
        .get(`http://localhost:3030/api/v1/anime/${keyword}`, {
          onDownloadProgress: setLoading(true),
        })
        .then((response) => {
          setAnime(response.data);
          console.log(response.data);
          setLoading(false);
        })
        .catch((err) => console.log(err));
  };

  const handleClick = (e) => {
    setKeyword(e);
  };

  return (
    <div>
      <NavHeader activekey={activeKey} onSelect={handleSelect} />
      <InputGroup style={styles}>
        <Input placeholder="Search" onChange={handleClick} />
        <InputGroup.Button>
          <Icon icon="search" />
        </InputGroup.Button>
      </InputGroup>
      <Panel
        shaded
        bordered
        bodyFill
        style={{ display: "inline-block", width: 240 }}
      >
        {loading ? (
          <Loader center content="loading..." />
        ) : (
          <>
            <img src="https://via.placeholder.com/240x240" height="240" />
            <Panel header="RSUITE">
              <p>
                <small>
                  A suite of React components, sensible UI design, and a
                  friendly development experience.
                </small>
              </p>
            </Panel>
          </>
        )}
      </Panel>
    </div>
  );
}

export default Homepage;
