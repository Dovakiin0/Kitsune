"use client";

import Artplayer from "artplayer";
import React, { useRef, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
function ArtPlayer({
  intro,
  outro,
  tracks,
  option,
  getInstance,
  ...rest
}: any) {
  const artRef = useRef();

  const trackOptions: Array<{ default: boolean; html: string; url: string }> =
    [];

  tracks.map((track: { label: string; file: string; kind: string }) => {
    if (track.kind === "captions") {
      trackOptions.push({
        default: track.label === "English",
        html: track.label,
        url: track.file,
      });
    }
  });

  useEffect(() => {
    const art = new Artplayer({
      ...option,
      container: artRef.current,
      highlight: [
        {
          time: intro?.start,
          text: "Intro Start",
        },
        {
          time: intro?.end,
          text: "Intro End",
        },
        {
          time: outro?.start,
          text: "Outro Start",
        },
        {
          time: outro?.end,
          text: "Outro End",
        },
      ],
      settings: [
        {
          width: 250,
          html: "Subtitle",
          tooltip: "Subtitle",

          selector: [
            {
              html: "Display",
              tooltip: "Show",
              switch: true,
              onSwitch: function (item) {
                item.tooltip = item.switch ? "Hide" : "Show";
                art.subtitle.show = !item.switch;
                return !item.switch;
              },
            },
            ...trackOptions,
          ],
          onSelect: function (item) {
            art.subtitle.switch(item.url, {
              name: item.html,
            });
            return item.html;
          },
        },
      ],
    });

    art.on("resize", () => {
      art.subtitle.style({
        fontSize: art.height * 0.05 + "px",
      });
    });

    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(true);
      }
    };
    //eslint-disable-next-line
  }, [option, trackOptions]);

  return <div ref={artRef} {...rest} style={{ background: "none" }}></div>;
}
/* eslint-disable @typescript-eslint/no-explicit-any */

export default ArtPlayer;
