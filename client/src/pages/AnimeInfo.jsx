import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import Player from "../components/Player.jsx";
import AnimeContext, { InfoContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, List, IconButton, Icon, Divider, Button } from "rsuite";
import { useParams } from "react-router";

function AnimeInfo(props) {
  const { name } = useParams();
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const [loading, setLoading] = useState(false);
  const [ep, setEp] = useState(1);
  const [animeInfo, setAnimeinfo] = useState();
  const { setInfo } = useContext(InfoContext);

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  useEffect(() => {
    getAnimeDetails();
  }, [animeContext.url, ep]);

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
          console.log(response.data);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    } else {
      props.history.push("/");
    }
  };

  const handleClick = (ep) => {
    let saveInfo = JSON.parse(localStorage.getItem(name));
    if (saveInfo === null) {
      localStorage.setItem(name, JSON.stringify([ep]));
    } else {
      if (!saveInfo.includes(ep))
        localStorage.setItem(name, JSON.stringify([...saveInfo, ep]));
    }
    setInfo(animeInfo);
    props.history.push({
      pathname: `${props.location.pathname}/${parseInt(ep)}`,
    });
  };

  const epCount = () => {
    let saveInfo = JSON.parse(localStorage.getItem(name));
    if (saveInfo === null) console.log("NO RECORD");
    let list = [];
    for (let [i, ep] of animeInfo.result.episodes.entries()) {
      list.push(
        <div style={{ padding: "2px", display: "inline-block" }}>
          <Button
            appearance={
              saveInfo !== null && saveInfo.includes(parseInt(ep.number))
                ? "default"
                : "ghost"
            }
            style={{ padding: "10px" }}
            onClick={() => handleClick(parseInt(ep.number))}
          >
            Episode {ep.number}
          </Button>
        </div>
      );
    }
    // for (let i = 1; i <= parseInt(animeInfo.result.episodeCount); i++) {}
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
            <p>Language: {animeInfo.result.language}</p>
            <p>{animeInfo.result.plot_summary}</p>
            <p>Released: {animeInfo.result["release_date_(jp)"]}</p>
            <p>Studio: {animeInfo.result.studio}</p>
            <p>Status: {animeInfo.result.status}</p>
            {/* <Player
              animeInfo={animeInfo}
              epi={ep}
              name={name}
              slug={animeInfo.result.slug}
              history={props.history}
              episodeCount={animeInfo.result.episodeCount}
            /> */}
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
