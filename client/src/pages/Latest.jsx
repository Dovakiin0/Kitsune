import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import { Panel, Loader, IconButton, Icon, Pagination } from "rsuite";
import axios from "axios";
import AnimeContext from "../hooks/animecontext";

function Latest(props) {
  const [latest, setLatest] = useState();
  const [loading, setLoading] = useState(false);
  const { setAnimeContext } = useContext(AnimeContext);
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    getLatestAnime();
  }, [activePage]);

  const getLatestAnime = () => {
    axios
      .get(`/api/v1/anime/page/${activePage}`, {
        onDownloadProgress: setLoading(true),
      })
      .then((response) => {
        setLatest(response.data);
        setLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const handlechange = (val) => {
    setActivePage(val);
  };

  const handleClick = (name) => {
    axios
      .get(`/api/v1/anime/${name}`)
      .then((res) => {
        setAnimeContext({ name: res.data[0].name, url: res.data[0].url });
        props.history.push(`/anime/${res.data[0].name.replace(/\s/g, "-")}`);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="latest">
      <NavHeader activekey={3} {...props} />
      <div>
        <h4>Latest Release</h4>
        <Pagination
          prev
          last
          next
          first
          size="md"
          pages={10}
          activePage={activePage}
          onSelect={handlechange}
        />
        <br />
        {loading ? (
          <Loader center size="md" />
        ) : latest ? (
          latest.map((datas) => (
            <>
              <Panel
                shaded
                bordered
                bodyFill
                style={{ display: "inline-block", width: 240 }}
              >
                <img src={datas.img} height="300" />
                <Panel header={datas.name}>
                  <p>
                    <small>{datas.ep}</small>
                    <IconButton
                      icon={<Icon icon="play" />}
                      onClick={() => handleClick(datas.name)}
                    />
                  </p>
                </Panel>
              </Panel>
            </>
          ))
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default Latest;
