"use client";
import React, { useEffect, useState } from "react";
import ArtPlayer from "./ArtPlayer";
import Hls from "hls.js";
import { Episode, IAnime } from "@/@types/EnimeType";
import useAnime from "@/hooks/useAnime";
import { TEpisodeInfo, TEpisodeSources } from "@/@types/AnimeType";
import loading from "../assets/genkai.gif";

type KitsunePlayerProps = {
  episodeInfo: Episode;
  animeInfo: IAnime;
};

function KitsunePlayer({ episodeInfo, animeInfo }: KitsunePlayerProps) {
  const [epSource, setEpSource] = useState<TEpisodeInfo | null>(null);
  const [uri, setUri] = useState<string>("");
  const { getEpisodeGogo, getEpisodeZoro } = useAnime();

  const fetchSource = async () => {
    if (!episodeInfo) return;
    let source;
    let data;

    if (typeof window !== "undefined") {
      if (localStorage?.getItem("provider") === "Gogo") {
        source = episodeInfo.sources[0].target;
        data = await getEpisodeGogo(source);
      }
      if (localStorage?.getItem("provider") === "Zoro") {
        source = episodeInfo.sources[1].target;
        data = await getEpisodeZoro(source);
      }
    }

    setEpSource(data);
    data.sources &&
      data.sources.map((source: TEpisodeSources) => {
        if (source.quality === "720p") {
          setUri("https://cors.zimjs.com/" + source.url);
        }
      });
  };

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
    poster: episodeInfo?.image ?? "",
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
    quality:
      epSource && epSource.sources
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
    subtitle: {
      url:
        typeof epSource?.subtitles !== "undefined"
          ? epSource?.subtitles.find((sub) => sub.lang === "English")?.url
          : "",
      type: "vtt",
      style: {
        color: "#fff",
      },
      encoding: "utf-8",
    },
    icons: {
      loading: `<img width="80" height="80" src="${loading.src}">`,
      // state: '<img width="150" heigth="150" src="/assets/img/state.svg">',
      // indicator: '<img width="16" heigth="16" src="/assets/img/indicator.svg">',
    },
  };

  useEffect(() => {
    fetchSource();
  }, []);

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
