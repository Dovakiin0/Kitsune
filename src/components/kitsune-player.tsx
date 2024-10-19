"use client";

import React, { useEffect, useRef } from "react";
import ArtPlayer from "./art-player";
import Hls from "hls.js";
import { IEpisodes, Source } from "@/types/episodes";
import loadingImage from "@/assets/genkai.gif";

type KitsunePlayerProps = {
  episodeInfo: IEpisodes;
  animeInfo: { title: string; image: string };
};

const KitsunePlayer = ({ episodeInfo, animeInfo }: KitsunePlayerProps) => {
  const playerRef = useRef<HTMLDivElement | null>(null); // Ref to hold the player container

  const defaultSource = episodeInfo.sources.find(
    (source) => source.quality === "720p"
  );
  const uri = defaultSource?.url;

  useEffect(() => {
    const videoElement = playerRef.current?.querySelector("video");

    let hls: Hls | null = null;

    if (videoElement && uri && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(uri);
      hls.attachMedia(videoElement);
    }

    // Clean up Hls instance when component unmounts
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [uri]); // Runs only when `uri` changes

  const options = {
    container: playerRef.current,
    url: uri,
    customType: {
      //eslint-disable-next-line
      m3u8: function (video: HTMLMediaElement, url: string, art: any) {
        if (Hls.isSupported()) {
          if (art.hls) art.hls.destroy();
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
          art.hls = hls;
          art.on("destroy", () => hls.destroy());
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = defaultSource?.url || "";
        } else {
          art.notice.show = "Unsupported playback format";
        }
      },
    },
    title: animeInfo.title,
    poster: animeInfo.image,
    volume: 1,
    isLive: false,
    muted: false,
    autoplay: true,
    autoOrientation: true,
    pip: true,
    autoSize: false,
    autoMini: false,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: false,
    subtitleOffset: false,
    miniProgressBar: false,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    theme: "#F5316F",
    whitelist: ["*"],
    moreVideoAttr: {
      crossOrigin: "anonymous",
    },
    quality:
      episodeInfo && episodeInfo.sources
        ? episodeInfo.sources.map((source: Source) => ({
            default: source.quality === "720p",
            html: source.quality,
            url: source.url,
          }))
        : [],
    thumbnails: {
      url: animeInfo.image,
      number: 60,
      column: 10,
    },
    // subtitle: {
    //   url:
    //     typeof epSource?.subtitles !== "undefined"
    //       ? epSource?.subtitles.find((sub) => sub.lang === "English")?.url
    //       : "",
    //   type: "vtt",
    //   style: {
    //     color: "#fff",
    //   },
    //   encoding: "utf-8",
    // },
    icons: {
      loading: `<img width="50" height="50" src="${loadingImage.src}">`,
    },
  };

  return (
    <div ref={playerRef} className="md:h-[800px] h-[250px] w-full">
      {uri ? (
        <ArtPlayer option={options} className="w-full h-full" />
      ) : (
        <div
          className="rounded-lg p-5 w-full h-full"
          style={{
            backgroundImage: `url(${animeInfo.image})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            filter: "blur(20px)",
            WebkitFilter: "blur(20px)",
          }}
        ></div>
      )}
    </div>
  );
};

export default KitsunePlayer;

