import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import { Panel, Loader, IconButton, Icon } from "rsuite";
import axios from "axios";
import AnimeContext from "../hooks/animecontext";

function Latest(props) {
  const [activeKey, setActiveKey] = useState();
  const [latest, setLatest] = useState();
  const [loading, setLoading] = useState(false);
  const { setAnimeContext } = useContext(AnimeContext);

  useEffect(() => {
    getLatestAnime();
  }, []);

  const getLatestAnime = () => {
    axios
      .get(`${process.env.REACT_APP_API_URI}/anime/`, {
        onDownloadProgress: setLoading(true),
      })
      .then((response) => {
        setLatest(response.data);
        setLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  const handleClick = (name) => {
    axios
      .get(`${process.env.REACT_APP_API_URI}/anime/${name}`)
      .then((res) => {
        setAnimeContext({ name: res.data[0].name, url: res.data[0].url });
        props.history.push(`/anime/${res.data[0].name.replace(/\s/g, "-")}`);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div style={{ padding: "10px" }}>
      <NavHeader activekey={activeKey} onSelect={handleSelect} {...props} />
      <h4>Latest Release</h4>
      {loading ? (
        <Loader center size="md" />
      ) : latest ? (
        latest.map((datas) => (
          <>
            <Panel
              shaded
              bordered
              bodyFill
              style={{ display: "inline-block", width: 240 }}
            >
              <img src={datas.img} height="300" />
              <Panel header={datas.name}>
                <p>
                  <small>{datas.ep}</small>
                  <IconButton
                    icon={<Icon icon="play" />}
                    onClick={() => handleClick(datas.name)}
                  />
                </p>
              </Panel>
            </Panel>
          </>
        ))
      ) : (
        ""
      )}
    </div>
  );
}

export default Latest;
