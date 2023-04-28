"use client";
import React from "react";
import ArtPlayer from "./ArtPlayer";
import { TEpisodeInfo, TAnimeInfo, TEpisodeSources } from "@/@types/AnimeType";
import Hls from "hls.js";

type KitsunePlayerProps = {
  episodeInfo: TEpisodeInfo;
  animeInfo: TAnimeInfo;
};

function KitsunePlayer({ episodeInfo, animeInfo }: KitsunePlayerProps) {
  let uri;
  episodeInfo.sources.map((source: TEpisodeSources) => {
    if (source.quality === "720p") {
      uri = "https://cors.zimjs.com/" + source.url;
    }
  });

  let options = {
    container: ".artplayer-app",
    url:
      typeof uri !== "undefined"
        ? uri
        : "https://cors.zimjs.com/" + episodeInfo.sources[0].url,
    customType: {
      m3u8: function(video: any, url: string) {
        let hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        if (!video.src) {
          video.src = url;
        }
      },
    },
    title: animeInfo.title,
    poster: animeInfo.image,
    volume: 1,
    isLive: false,
    muted: false,
    autoplay: false,
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
    miniProgressBar: true,
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
    quality: episodeInfo.sources.map((source: TEpisodeSources) => ({
      default: source.quality === "720p",
      html: source.quality,
      url: "https://cors.zimjs.com/" + source.url,
    })),
    thumbnails: {
      url: animeInfo.image,
      number: 60,
      column: 10,
    },
    // icons: {
    //   loading: '<img src="/assets/img/ploading.gif">',
    //   state: '<img width="150" heigth="150" src="/assets/img/state.svg">',
    //   indicator: '<img width="16" heigth="16" src="/assets/img/indicator.svg">',
    // },
  };

  return (
    <ArtPlayer option={options} className="md:h-[800px] h-[250px] w-full" />
  );
}

export default KitsunePlayer;
