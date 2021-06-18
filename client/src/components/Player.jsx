import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader, Button, Divider, IconButton, Icon } from "rsuite";
import AnimeContext from "../hooks/animecontext";
import { InfoContext } from "../hooks/animecontext";

export default function Player(props) {
  const { epi, name, episodeCount, slug, animeInfo } = props;
  const { animeContext } = useContext(AnimeContext);
  const [episodes, setEpisodes] = useState();
  const [loading, setLoading] = useState(false);
  const { ep } = useParams();
  const [currentEpisode, setCurrentEpisode] = useState(epi);
  const { setInfo } = useContext(InfoContext);

  useEffect(() => {
    getEpisode();
  }, [animeContext.url, epi, currentEpisode]);

  const getEpisode = async () => {
    if (animeContext.url) {
      try {
        const res = await axios.post(
          `/api/v1/anime/episode/${currentEpisode}`,
          { slug },
          {
            onDownloadProgress: setLoading(true),
          }
        );
        setEpisodes(res.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    } else {
      props.history.push("/");
    }
  };
  const handleNext = () => {
    // setInfo(animeInfo);
    let saveInfo = JSON.parse(localStorage.getItem(name));
    if (!saveInfo.includes(currentEpisode)) {
      localStorage.setItem(
        name,
        JSON.stringify([...saveInfo, parseInt(currentEpisode) + 1])
      );
    }

    if (ep) {
      props.history.push(`/anime/${name}/${parseInt(ep) + 1}`);
    } else {
      setCurrentEpisode(currentEpisode + 1);
    }
  };
  const handlePrevious = () => {
    // setInfo(animeInfo);
    let saveInfo = JSON.parse(localStorage.getItem(name));
    if (!saveInfo.includes(currentEpisode))
      localStorage.setItem(
        name,
        JSON.stringify([...saveInfo, parseInt(currentEpisode) - 1])
      );
    if (ep) {
      props.history.push(`/anime/${name}/${parseInt(ep) - 1}`);
    } else {
      setCurrentEpisode(currentEpisode - 1);
    }
  };
  return (
    <div className='watch-episode'>
      {loading ? (
        <Loader center size='md' />
      ) : (
        <>
          {episodes ? (
            <>
              <Divider />
              <h4>Watch {episodes.name}</h4>
              {!ep && (
                <Button
                  appearance={"primary"}
                  style={{ padding: "10px", marginTop: "10px" }}
                  onClick={() => {
                    props.history.push(`/anime/${name}/${currentEpisode}`);
                  }}>
                  Open in New Window
                </Button>
              )}
              <Divider />
              <video
                className='episode-video-player'
                width='320'
                height='240'
                controls
                src={episodes.download[0].link}></video>
              <IconButton
                icon={<Icon icon='arrow-left' />}
                placement='left'
                style={{ float: "left" }}
                onClick={handlePrevious}
                disabled={parseInt(currentEpisode) === 1 ? true : false}>
                Previous
              </IconButton>
              <IconButton
                icon={<Icon icon='arrow-right' />}
                placement='right'
                style={{ float: "right" }}
                onClick={handleNext}
                disabled={
                  parseInt(episodeCount) === parseInt(currentEpisode)
                    ? true
                    : false
                }>
                Next
              </IconButton>
              <Divider />
            </>
          ) : (
            <Loader center size='md' />
          )}
        </>
      )}
    </div>
  );
}
