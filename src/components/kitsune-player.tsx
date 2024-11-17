"use client";

import React, { useEffect, useMemo, useRef } from "react";
import ArtPlayer from "./art-player";
import Hls from "hls.js";
import { IEpisodeSource } from "@/types/episodes";
import loadingImage from "@/assets/genkai.gif";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginAmbilight from "artplayer-plugin-ambilight";

type KitsunePlayerProps = {
  episodeInfo: IEpisodeSource;
  animeInfo: { title: string; image: string };
};

const KitsunePlayer = ({ episodeInfo, animeInfo }: KitsunePlayerProps) => {
  const playerRef = useRef<HTMLDivElement | null>(null); // Ref to hold the player container
  const uri = episodeInfo?.sources[0].url;

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

  const options = useMemo(
    () => ({
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
            video.src = url;
          } else {
            art.notice.show = "Unsupported playback format";
          }
        },
      },
      plugins: [
        artplayerPluginAmbilight({
          blur: "30px",
          opacity: 1,
          frequency: 10,
          duration: 0.3,
          zIndex: -1,
        }),
        artplayerPluginHlsControl({
          quality: {
            // Show qualitys in control
            control: true,
            // Show qualitys in setting
            setting: true,
            // Get the quality name from level
            getName: (level: any) => level.height + "P",
            // I18n
            title: "Quality",
            auto: "Auto",
          },
          audio: {
            // Show audios in control
            control: true,
            // Show audios in setting
            setting: true,
            // Get the audio name from track
            getName: (track: any) => track.name,
            // I18n
            title: "Audio",
            auto: "Auto",
          },
        }),
      ],
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
      // settings: [
      //   {
      //     width: 200,
      //     html: "Subtitle",
      //     selector: [
      //       {
      //         html: "Display",
      //         tooltip: "Show",
      //         switch: true,
      //         onSwitch: function (item: any) {
      //           // item.tooltip = item.switch ? 'Hide' : 'Show';
      //           // playerRef?.current.subtitle.show = !item.switch;
      //           // return !item.switch;
      //         },
      //       },
      //       episodeInfo?.tracks.map((track) => ({
      //         default: track.label === "English",
      //         html: track.label,
      //         url: track.file,
      //       })),
      //     ],
      //     onSelect: function (item: any) {
      //       playerRef.current?.subtitle.switch(item.url, {
      //         name: item.html,
      //       });
      //       return item.html;
      //     },
      //   },
      // ],
      // thumbnails: {
      //   url: animeInfo.image,
      //   number: 60,
      //   column: 10,
      // },
      subtitle: {
        url: episodeInfo?.tracks.find((track) => track.label === "English")
          ?.file,
        type: "vtt",
        style: {
          color: "#fff",
        },
        encoding: "utf-8",
      },
      icons: {
        loading: `<img width="50" height="50" src="${loadingImage.src}">`,
      },
    }),
    [uri, animeInfo],
  );

  return (
    <div
      ref={playerRef}
      className="w-full h-full lg:max-h-[60vh] max-h-[40vh] min-h-[40vh]"
    >
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
