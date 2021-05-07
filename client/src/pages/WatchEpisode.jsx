import React, { useState, useContext, useEffect } from "react";
import NavHeader from "../components/header";
import AnimeContext, { InfoContext } from "../hooks/animecontext";
import axios from "axios";
import { Loader, FlexboxGrid, Divider } from "rsuite";
import { useParams } from "react-router";
import Iframe from "react-iframe";

function WatchEpisode(props) {
  const [activeKey, setActiveKey] = useState();
  const { animeContext } = useContext(AnimeContext);
  const { ep } = useParams();
  const [episodes, setEpisodes] = useState();
  const [loading, setLoading] = useState(false);
  const { info } = useContext(InfoContext);

  useEffect(() => {
    getEpisode();
  }, [animeContext.url]);

  console.log(info);

  const getEpisode = () => {
    if (animeContext.url) {
      axios
        .post(
          `${process.env.REACT_APP_API_URI}/anime/episode/${ep}`,
          { uri: animeContext.url },
          { onDownloadProgress: setLoading(true) }
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
  return (
    <div style={{ padding: "10px" }}>
      <NavHeader activekey={activeKey} onSelect={handleSelect} />

      {loading ? (
        <Loader center size="md" />
      ) : (
        <>
          <h4>
            Watch Episode {ep} of {info.result.name}
          </h4>
          <Divider />
          {episodes ? (
            <Iframe
              position="absolute"
              width="40%"
              height="50%"
              allowFullScreen
              frameBorder
              url={`https://${episodes.videoLinks[1].url}`}
            />
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
