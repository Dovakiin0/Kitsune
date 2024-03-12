"use client";
import React, { useEffect, useState } from "react";
import ArtPlayer from "./ArtPlayer";
import Hls from "hls.js";
import useAnime from "@/hooks/useAnime";
import {
  IAnimeInfo,
  IEpisodes,
  TEpisodeInfo,
  TEpisodeSources,
} from "@/@types/AnimeType";
import loading from "../assets/genkai.gif";

type KitsunePlayerProps = {
  episodeInfo: IEpisodes;
  animeInfo: IAnimeInfo;
};

function KitsunePlayer({ episodeInfo, animeInfo }: KitsunePlayerProps) {
  const [epSource, setEpSource] = useState<TEpisodeInfo | null>(null);
  const [uri, setUri] = useState<string>("");
  const { getEpisodeGogo } = useAnime();

  const fetchSource = async () => {
    if (!episodeInfo) return;
    let source = episodeInfo.id;
    let data = await getEpisodeGogo(source);

    setEpSource(data);
    data.sources &&
      data.sources.map((source: TEpisodeSources) => {
        if (source.quality === "720p") {
          setUri(source.url);
        }
      });
  };

  let options = {
    container: ".artplayer-app",
    url: uri,
    customType: {
      m3u8: function(video: any, url: string, art: any) {
        if (Hls.isSupported()) {
          if (art.hls) art.hls.destroy();
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
          art.hls = hls;
          art.on("destroy", () => hls.destroy());
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
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
      epSource && epSource.sources
        ? epSource.sources.map((source: TEpisodeSources) => ({
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
        backgroundImage: `url(${animeInfo.image})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        filter: "blur(20px)",
        WebkitFilter: "blur(20px)",
      }}
    ></div>
  );
}

export default KitsunePlayer;
