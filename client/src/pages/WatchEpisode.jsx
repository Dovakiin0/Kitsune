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
  const [videoIndex, setVideoIndex] = useState(1);

  useEffect(() => {
    getEpisode();
  }, [animeContext.url, ep]);

  const getEpisode = () => {
    if (animeContext.url) {
      axios
        .post(
          `/api/v1/anime/episode/${ep}`,
          { uri: animeContext.url },
          { onDownloadProgress: setLoading(true) }
        )
        .then((response) => {
          setEpisodes(response.data.videoLinks);
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
    props.history.push(
      `/anime/${animeContext.name.replace(/\s/g, "-")}/${parseInt(ep) + 1}`
    );
  };
  const handlePrevious = () => {
    props.history.push(
      `/anime/${animeContext.name.replace(/\s/g, "-")}/${parseInt(ep) - 1}`
    );
  };

  return (
    <div className="watch-episode">
      <NavHeader activekey={activeKey} onSelect={handleSelect} />
      {loading ? (
        <Loader center size="md" />
      ) : (
        <>
          <Divider />
          <h4>
            Watch Episode {ep} of {animeContext.name}
          </h4>
          <Divider />
          {episodes ? (
            <>
              <iframe
                className="episode-video-player"
                allowFullScreen
                frameBorder
                src={
                  videoIndex === 1
                    ? `https://${episodes[videoIndex].url}`
                    : episodes[videoIndex].url
                }
              />
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
                  info.result.episodes.length === parseInt(ep) ? true : false
                }
              >
                Next
              </IconButton>
              <Divider />

              <div>Select Server:</div>
              <Button appearance="subtle" onClick={() => setVideoIndex(1)}>
                MultiQuality
              </Button>
              <Button appearance="subtle" onClick={() => setVideoIndex(2)}>
                StreamSB
              </Button>
              <Button appearance="subtle" onClick={() => setVideoIndex(3)}>
                Doodstream
              </Button>
              <Button appearance="subtle" onClick={() => setVideoIndex(4)}>
                Streamtape
              </Button>
              <Button appearance="subtle" onClick={() => setVideoIndex(5)}>
                Mixdrop
              </Button>
              <Button appearance="subtle" onClick={() => setVideoIndex(6)}>
                Xstreamcdn
              </Button>
              <Button appearance="subtle" onClick={() => setVideoIndex(7)}>
                Mp4upload
              </Button>
              <br />
            </>
          ) : (
            <Loader center size="md" />
          )}
          <Divider />
        </>
      )}
    </div>
  );
}

export default WatchEpisode;
