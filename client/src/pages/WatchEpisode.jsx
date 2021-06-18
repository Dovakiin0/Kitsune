import React, { useState, useContext, useEffect } from "react";

import NavHeader from "../components/header";
import Player from "../components/Player";

import { InfoContext } from "../hooks/animecontext";

import { useParams } from "react-router";

function WatchEpisode(props) {
  const [activeKey, setActiveKey] = useState();

  const { ep, name } = useParams();
  const { info } = useContext(InfoContext);

  const handleSelect = (event) => {
    setActiveKey(event);
  };
  useEffect(() => {
    renderVideo();
  }, [info, ep]);

  const renderVideo = () => {
    if (info) {
      return (
        <>
          <div className='nav-header'>
            <NavHeader
              activekey={activeKey}
              onSelect={handleSelect}
              {...props}
            />
          </div>
          <Player
            epi={ep}
            name={name}
            slug={info.result.slug}
            history={props.history}
            episodeCount={info.result.episodeCount}
          />
        </>
      );
    } else {
      props.history.push(`/`);
      return <div></div>;
    }
  };
  return renderVideo();
}

export default WatchEpisode;
