import React, { useState, useEffect, useContext } from "react";
import Search from "../components/Search";
import NavHeader from "../components/header";
import AnimeContext, { EpisodeContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, List, IconButton, Icon } from "rsuite";

function AnimeInfo(props) {
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const { setEpisodeUrl } = useContext(EpisodeContext);
  const [loading, setLoading] = useState(false);
  const [animeInfo, setAnimeinfo] = useState();
  const [episodes, setEpisodes] = useState();

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
          "http://localhost:3030/api/v1/anime",
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

  const handleClick = (url, ep) => {
    setEpisodeUrl(url);
    props.history.push(`${props.location.pathname}/${ep}`);
  };

  return (
    <>
      <NavHeader activekey={activeKey} onSelect={handleSelect} />
      <Search {...props} />

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
                <List.Item>
                  {eps.name}
                  <IconButton
                    icon={
                      <Icon
                        icon="play"
                        onClick={() => handleClick(eps.url, index + 1)}
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
    </>
  );
}

export default AnimeInfo;
