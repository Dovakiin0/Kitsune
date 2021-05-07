import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import AnimeContext, { InfoContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, List, IconButton, Icon } from "rsuite";

function AnimeInfo(props) {
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const [loading, setLoading] = useState(false);
  const [animeInfo, setAnimeinfo] = useState();
  const [episodes, setEpisodes] = useState();
  const { setInfo } = useContext(InfoContext);

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  useEffect(() => {
    getAnimeDetails();
  }, [animeContext.url]);

  const getAnimeDetails = () => {
    if (animeContext.url !== "") {
      axios
        .post(
          `${process.env.REACT_APP_API_URI}/anime`,
          { uri: animeContext.url },
          { onDownloadProgress: setLoading(true) }
        )
        .then((response) => {
          setAnimeinfo(response.data);
          setEpisodes(response.data.result.episodes);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    } else {
      props.history.push("/");
    }
  };

  const handleClick = (ep) => {
    setInfo(animeInfo);
    props.history.push(`${props.location.pathname}/${ep}`);
  };

  return (
    <div style={{ padding: "10px" }}>
      <NavHeader activekey={activeKey} onSelect={handleSelect} {...props} />

      {loading ? (
        <Loader center size="md" />
      ) : animeInfo ? (
        <div className="anime-info">
          <img src={animeInfo.image} />
          <h3>{animeInfo.result.name}</h3>
          <p>{animeInfo.result.summary}</p>
          <p>Released: {animeInfo.result.released}</p>
          <p>Genre: {animeInfo.result.genres.map((data) => data + ", ")}</p>
          <h4>Episodes:</h4>
          <List hover bordered>
            {episodes.map((eps, index) => (
              <>
                <List.Item style={{ display: "inline-block" }}>
                  {eps.name}
                  <IconButton
                    icon={
                      <Icon
                        icon="play"
                        onClick={() => handleClick(index + 1)}
                      />
                    }
                  />
                </List.Item>
              </>
            ))}
          </List>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

export default AnimeInfo;
