"use client";
import React, { useEffect, useState } from "react";
import ArtPlayer from "./ArtPlayer";
import Hls from "hls.js";
import { Episode, EpisodeSource, IAnime } from "@/@types/EnimeType";
import useAnime from "@/hooks/useAnime";
import { TEpisodeInfo, TEpisodeSources } from "@/@types/AnimeType";

type KitsunePlayerProps = {
  episodeInfo: Episode;
  animeInfo: IAnime;
};

function KitsunePlayer({ episodeInfo, animeInfo }: KitsunePlayerProps) {
  const [epSource, setEpSource] = useState<TEpisodeInfo | null>(null);
  const [uri, setUri] = useState<string>("");
  const { getEpisode } = useAnime();

  const fetchSource = async () => {
    const data = await getEpisode(episodeInfo.sources[0].target);
    setEpSource(data);
    data.sources.map((source: TEpisodeSources) => {
      if (source.quality === "720p") {
        setUri("https://cors.zimjs.com/" + source.url);
      }
    });
  };

  useEffect(() => {
    fetchSource();
  }, []);

  let options = {
    container: ".artplayer-app",
    url: uri,
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
    poster: episodeInfo.image ?? "",
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
    quality: epSource
      ? epSource.sources.map((source: TEpisodeSources) => ({
        default: source.quality === "720p",
        html: source.quality,
        url: "https://cors.zimjs.com/" + source.url,
      }))
      : [],
    thumbnails: {
      url: animeInfo.coverImage,
      number: 60,
      column: 10,
    },
    // icons: {
    //   loading: '<img src="/assets/img/ploading.gif">',
    //   state: '<img width="150" heigth="150" src="/assets/img/state.svg">',
    //   indicator: '<img width="16" heigth="16" src="/assets/img/indicator.svg">',
    // },
  };

  return epSource ? (
    <ArtPlayer option={options} className="md:h-[800px] h-[250px] w-full" />
  ) : (
    <div
      className={`rounded-lg p-5 md:h-[800px] h-[250px] w-full`}
      style={{
        backgroundImage: `url(${animeInfo.bannerImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        filter: "blur(20px)",
        WebkitFilter: "blur(20px)",
      }}
    ></div>
  );
}

export default KitsunePlayer;
