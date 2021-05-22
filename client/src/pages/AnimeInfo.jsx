import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import AnimeContext, { InfoContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, List, IconButton, Icon, Divider } from "rsuite";

function AnimeInfo(props) {
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const [loading, setLoading] = useState(false);
  const [animeInfo, setAnimeinfo] = useState();
  const { setInfo } = useContext(InfoContext);

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  useEffect(() => {
    getAnimeDetails();
  }, [animeContext.url]);

  console.log(animeContext);

  const getAnimeDetails = () => {
    if (animeContext.url !== "") {
      axios
        .post(
          `/api/v1/anime`,
          { uri: animeContext.url },
          { onDownloadProgress: setLoading(true) }
        )
        .then((response) => {
          setAnimeinfo(response.data);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    } else {
      props.history.push("/");
    }
  };

  const handleClick = (ep) => {
    setInfo(animeInfo);
    props.history.push({
      pathname: `${props.location.pathname}/${ep}`,
    });
  };

  const epCount = () => {
    let list = [];
    for (let i = 0; i < parseInt(animeInfo.result.episodeCount); i++) {
      list.push(
        <List.Item style={{ display: "inline-block" }}>
          {`Episode ${i + 1}`}
          <IconButton
            icon={<Icon icon="play" onClick={() => handleClick(i + 1)} />}
          />
        </List.Item>
      );
    }
    return list;
  };

  return (
    <>
      <div className="nav-header">
        <NavHeader activekey={activeKey} onSelect={handleSelect} {...props} />
      </div>
      <div className="anime-info">
        {loading ? (
          <Loader center size="md" />
        ) : animeInfo ? (
          <div>
            <img src={animeInfo.result.image} width="250" />
            <h3>{animeInfo.result.name}</h3>
            <p>{animeInfo.result.plot_summary}</p>
            <p>Released: {animeInfo.result.released}</p>
            <p>Genre: {animeInfo.result.genre}</p>
            <Divider />
            <h4>Episodes:</h4>
            <List hover bordered>
              {epCount()}
            </List>
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
}

export default AnimeInfo;
