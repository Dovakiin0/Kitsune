"use client";

import React from "react";
import VideoPlayer from "./VideoPlayer";

type KitsuneVideoProps = {
  src: string;
};

function KitsuneVideo({ src }: KitsuneVideoProps) {
  const playerRef = React.useRef<any | null>(null);

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: "https://cors.zimjs.com/" + src,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player: any) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      console.log("player is waiting");
    });

    player.on("dispose", () => {
      console.log("player will dispose");
    });
  };

  return <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />;
}

export default KitsuneVideo;
