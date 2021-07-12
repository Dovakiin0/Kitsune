import React, { useState, useContext, useEffect } from "react";
import NavHeader from "../components/header";
import AnimeContext, { InfoContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, Button, Divider, IconButton, Icon } from "rsuite";
import { useParams } from "react-router";

function WatchEpisode(props) {
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const { ep, name } = useParams();
  const [episode, setEpisode] = useState();
  const [loading, setLoading] = useState(false);
  const { info } = useContext(InfoContext);

  //ep has episode number of info.result.episodes[]

  useEffect(() => {
    getEpisode();
    checkLocalStorage();
  }, [animeContext.url, ep]);

  const checkLocalStorage = () => {
    let saveInfo = JSON.parse(localStorage.getItem(name));
    if (!saveInfo.includes(parseInt(ep)))
      localStorage.setItem(name, JSON.stringify([...saveInfo, parseInt(ep)]));
  };

  const getEpisode = () => {
    if (animeContext.url) {
      axios
        .post(
          `/api/v1/anime/episode`,
          { uri: info.result.episodes[ep - 1].link },
          {
            onDownloadProgress: setLoading(true),
          }
        )
        .then((response) => {
          setEpisode(response.data);
          setLoading(false);
        })
        .catch((err) => console.log(err));
    } else {
      props.history.push("/");
    }
  };

  const handleSelect = (event) => {
    setActiveKey(event);
  };

  const handleNext = () => {
    props.history.push(`/anime/${props.match.params.name}/${parseInt(ep) + 1}`);
  };

  const handlePrevious = () => {
    props.history.push(`/anime/${props.match.params.name}/${parseInt(ep) - 1}`);
  };

  return (
    <>
      <div className="nav-header">
        <NavHeader activekey={activeKey} onSelect={handleSelect} {...props} />
      </div>
      <div className="watch-episode">
        {loading ? (
          <Loader center size="md" />
        ) : (
          <>
            {episode ? (
              <>
                <Divider />
                <h4>
                  Watch {episode.name} Episode {episode.currentEpisode}
                </h4>
                <Divider />
                <video
                  className="episode-video-player"
                  width="320"
                  height="240"
                  controls
                  src={episode.download[0].link}
                ></video>
                <IconButton
                  icon={<Icon icon="arrow-left" />}
                  placement="left"
                  style={{ float: "left" }}
                  onClick={handlePrevious}
                  disabled={parseInt(ep) === 1 ? true : false}
                >
                  Previous
                </IconButton>
                <IconButton
                  icon={<Icon icon="arrow-right" />}
                  placement="right"
                  style={{ float: "right" }}
                  onClick={handleNext}
                  disabled={
                    parseInt(info.result.episodeCount) === parseInt(ep)
                      ? true
                      : false
                  }
                >
                  Next
                </IconButton>
                <Divider />
              </>
            ) : (
              <Loader center size="md" />
            )}
            <Divider />
          </>
        )}
      </div>
    </>
  );
}

export default WatchEpisode;
