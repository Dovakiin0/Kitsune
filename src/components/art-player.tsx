"use client";

import Artplayer from "artplayer";
import React, { useRef, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const generateHighlights = (start: any, end: any, label: any) => {
  if (start == null || end == null || start > end) return [];
  const highlights = [];
  for (let time = start; time <= end; time++) {
    highlights.push({ time, text: `${label}` });
  }
  return highlights;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function ArtPlayer({
  intro,
  outro,
  tracks,
  option,
  getInstance,
  artRef,
  ...rest
}: any) {
  const artInstanceRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!artRef.current) return;

    if (artInstanceRef.current) {
      artInstanceRef.current.destroy(true);
    }

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

    const art = new Artplayer({
      ...option,
      container: artRef.current,
      highlight: [
        ...generateHighlights(intro?.start, intro?.end, "Intro"),
        ...generateHighlights(outro?.start, outro?.end, "Outro"),
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

    artInstanceRef.current = art;

    art.on("resize", () => {
      art.subtitle.style({
        fontSize: art.height * 0.04 + "px",
      });
    });

    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }

    return () => {
      if (artInstanceRef.current) {
        art.destroy(true);
      }
    };
    //eslint-disable-next-line
  }, [option, intro, outro, tracks, artRef, getInstance]);

  return <div ref={artRef} {...rest} style={{ background: "none" }}></div>;
}
/* eslint-disable @typescript-eslint/no-explicit-any */

export default ArtPlayer;
