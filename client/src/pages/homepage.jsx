import React, { useState, useEffect, useContext } from "react";
import NavHeader from "../components/header";
import { Carousel, Loader, SelectPicker } from "rsuite";
import axios from "axios";

function Homepage(props) {
  const [images, setImages] = useState();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("waifu");

  useEffect(() => {
    getRandom();
  }, [keyword]);

  const options = [
    {
      label: "waifu",
      value: "waifu",
    },
    {
      label: "neko",
      value: "neko",
    },
    {
      label: "shinobu",
      value: "shinobu",
    },
    {
      label: "megumin",
      value: "megumin",
    },
    {
      label: "pat",
      value: "pat",
    },
    {
      label: "smug",
      value: "smug",
    },
    {
      label: "smile",
      value: "smile",
    },
    {
      label: "nom",
      value: "nom",
    },
    {
      label: "slap",
      value: "slap",
    },
  ];

  const getRandom = () => {
    axios
      .post(
        `/api/v1/anime/random/keyword/${keyword}`,
        {},
        { onDownloadProgress: setLoading(true) }
      )
      .then((res) => {
        setImages(res.data.files);
        setLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const handleChange = (val) => {
    setKeyword(val);
  };

  return (
    <div className="homepage">
      <NavHeader activekey={1} {...props} />
      <h4>Welcome to Anime World-Z</h4>
      <br />
      <Carousel
        autoplay
        className="custom-slider"
        shape="bar"
        style={{
          width: "100vh",
          height: "60vh",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {loading ? (
          <Loader center />
        ) : images ? (
          images.map((img) => <img src={img} />)
        ) : (
          ""
        )}
      </Carousel>
      <br />
      <div>
        Choose Category:
        <SelectPicker
          data={options}
          style={{ width: 224 }}
          onSelect={handleChange}
        />
        <br />
        <i>*Choose Pat for Stress Relief</i>
      </div>
    </div>
  );
}

export default Homepage;
