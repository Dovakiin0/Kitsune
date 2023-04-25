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
