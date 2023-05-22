"use client";
import Artplayer from "artplayer";
import React, { useRef, useEffect } from "react";

function ArtPlayer({ option, getInstance, ...rest }: any) {
  const artRef = useRef();

  useEffect(() => {
    const art = new Artplayer({
      ...option,
      container: artRef.current,
    });

    art.on("resize", () => {
      art.subtitle.style({
        fontSize: art.height * 0.05 + "px",
      });
    });

    art.on("subtitleUpdate", (text) => {
      art.template.$subtitle.innerHTML = text;
    });

    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, []);

  return <div ref={artRef} {...rest}></div>;
}

export default ArtPlayer;
