import React, { useState, useContext, useEffect } from "react";
import NavHeader from "../components/header";
import AnimeContext, { InfoContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, Button, Divider, IconButton, Icon } from "rsuite";
import { useParams } from "react-router";

function WatchEpisode(props) {
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const { ep } = useParams();
  const [episodes, setEpisodes] = useState();
  const [loading, setLoading] = useState(false);
  const { info } = useContext(InfoContext);

  useEffect(() => {
    getEpisode();
  }, [animeContext.url, ep]);

  const getEpisode = () => {
    if (animeContext.url) {
      axios
        .post(
          `/api/v1/anime/episode/${ep}`,
          { slug: info.result.slug },
          {
            onDownloadProgress: setLoading(true),
          }
        )
        .then((response) => {
          setEpisodes(response.data);
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

  console.log(info);

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
            {episodes ? (
              <>
                <Divider />
                <h4>Watch {episodes.name}</h4>
                <Divider />
                <video
                  className="episode-video-player"
                  width="320"
                  height="240"
                  controls
                  src={episodes.download[0].link}
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
