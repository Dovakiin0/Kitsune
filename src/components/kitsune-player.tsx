"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  HTMLAttributes,
} from "react";
import Artplayer from "artplayer";
import type { Option } from "artplayer";
import Hls from "hls.js";

// Helper functions and types (keep or import from your types file)
import { IEpisodeServers, IEpisodeSource, IEpisodes } from "@/types/episodes"; // Adjust path as needed
import loadingImage from "@/assets/genkai.gif"; // Adjust path as needed
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginAmbilight from "artplayer-plugin-ambilight";
import { cn } from "@/lib/utils";
import { buildStreamProxyUrl } from "@/lib/local-proxy";
import { useAuthStore } from "@/store/auth-store";
import useBookMarks from "@/hooks/use-get-bookmark";
import { pb } from "@/lib/pocketbase";
import Image from "next/image";

const WATCH_PROGRESS_UPDATE_INTERVAL = 10000; // Update every 10 seconds
const WATCH_PROGRESS_MIN_WATCH_TIME = 10; // Min seconds watched to create record

// --- Define Props for the Combined Player ---
interface ArtPlayerProps extends HTMLAttributes<HTMLDivElement> {
  episodeInfo: IEpisodeSource; // Source info including URLs, tracks, intro/outro
  animeInfo: { title: string; image: string; id: string }; // Basic anime info for poster etc.
  subOrDub: "sub" | "dub"; // Use literal type for clarity
  episodes?: IEpisodes; // Optional: If needed for playlist features later
  getInstance?: (art: Artplayer) => void; // Callback to get the instance
  autoSkip?: boolean;
  serversData: IEpisodeServers;
  onError?: () => void;
}

// --- Helper to generate highlights ---
interface HighlightPoint {
  time: number;
  text: string;
}
const generateHighlights = (
  start: number | undefined | null,
  end: number | undefined | null,
  label: string,
): HighlightPoint[] => {
  if (start == null || end == null || start >= end) return []; // Use >= to avoid single-second highlights
  const highlights: HighlightPoint[] = [];
  for (let time = Math.floor(start); time <= Math.floor(end); time++) {
    highlights.push({ time, text: label });
  }
  return highlights;
};

// --- The Combined ArtPlayer Component ---
function KitsunePlayer({
  episodeInfo,
  animeInfo,
  subOrDub,
  getInstance,
  autoSkip = true,
  serversData,
  onError,
  ...rest // Spread other div attributes like className, id, etc.
}: ArtPlayerProps): React.JSX.Element {
  const artContainerRef = useRef<HTMLDivElement>(null); // Ref for the mounting div
  const artInstanceRef = useRef<Artplayer | null>(null); // Ref for the ArtPlayer instance
  const hlsInstanceRef = useRef<Hls | null>(null); // Ref for the Hls.js instance

  const isAutoSkipEnabledRef = useRef<boolean>(autoSkip);
  const animeInfoRef = useRef(animeInfo);
  const serversDataRef = useRef(serversData);
  animeInfoRef.current = animeInfo;
  serversDataRef.current = serversData;

  const bookmarkIdRef = useRef<string | null>(null);
  const inflightBookmarkRef = useRef<Promise<string | null> | null>(null);
  const watchHistoryIdsRef = useRef<string[]>([]); // Store initial list
  const watchedRecordIdRef = useRef<string | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const hasMetMinWatchTimeRef = useRef<boolean>(false); // Track if min time met for this episode
  const initialSeekTimeRef = useRef<number | null>(null);

  const { auth } = useAuthStore();
  const { createOrUpdateBookMark, syncWatchProgress } = useBookMarks({
    populate: false,
  });

  useEffect(() => {
    isAutoSkipEnabledRef.current = autoSkip;
  }, [autoSkip]);

  const ensureBookmarkId = React.useCallback(async (): Promise<string | null> => {
    if (bookmarkIdRef.current) return bookmarkIdRef.current;
    if (inflightBookmarkRef.current) return inflightBookmarkRef.current;
    const currentUserId = auth?.id || pb.authStore.record?.id;
    const info = animeInfoRef.current;
    if (!currentUserId || !info?.id || info.id === "0") return null;

    inflightBookmarkRef.current = createOrUpdateBookMark(
      String(info.id),
      info.title || "Anime",
      info.image || "",
      "watching",
      false,
    )
      .then((id) => {
        if (id) bookmarkIdRef.current = id;
        return id;
      })
      .finally(() => {
        inflightBookmarkRef.current = null;
      });

    return inflightBookmarkRef.current;
  }, [auth?.id, createOrUpdateBookMark]);

  const ensureBookmarkAndSync = React.useCallback(
    async (currentTime: number, duration: number) => {
      const bId = await ensureBookmarkId();
      if (!bId) return;
      const srv = serversDataRef.current;
      const epNum = parseInt(srv.episodeNo, 10) || 1;
      const recordId = await syncWatchProgress(
        bId,
        watchedRecordIdRef.current,
        {
          episodeId: srv.episodeId,
          episodeNumber: epNum,
          current: currentTime,
          duration: duration,
        },
      );
      if (recordId) {
        watchedRecordIdRef.current = recordId;
        if (!watchHistoryIdsRef.current.includes(recordId)) {
          watchHistoryIdsRef.current.push(recordId);
        }
      }
    },
    [ensureBookmarkId, syncWatchProgress],
  );

  // --- Construct Stream URI via active HLS proxy (/api/proxy or local companion) ---
  const firstSource = episodeInfo?.sources?.[0];
  const uri = useMemo(() => {
    if (!firstSource?.url) return null;
    return buildStreamProxyUrl({
      url: firstSource.url,
      referer: firstSource.referer || episodeInfo?.headers?.Referer,
      headers: firstSource.headers,
      playlistKey: firstSource.playlist_key,
    });
  }, [firstSource, episodeInfo]);

  const skipTimesRef = useRef<{
    introStart?: number;
    introEnd?: number;
    validIntro: boolean;
    outroStart?: number;
    outroEnd?: number;
    validOutro: boolean;
  }>({ validIntro: false, validOutro: false });

  useEffect(() => {
    const currentUserId = auth?.id || pb.authStore.record?.id;
    if (!currentUserId || !animeInfo.id || !serversData.episodeId) {
      bookmarkIdRef.current = null;
      watchedRecordIdRef.current = null;
      watchHistoryIdsRef.current = [];
      hasMetMinWatchTimeRef.current = false;
      initialSeekTimeRef.current = null;
      return;
    }

    let isMounted = true;

    const fetchBookmarkAndWatchedId = async () => {
      const id = await ensureBookmarkId();

      if (!isMounted || !id) {
        bookmarkIdRef.current = null;
        watchedRecordIdRef.current = null;
        watchHistoryIdsRef.current = [];
        initialSeekTimeRef.current = null;
        hasMetMinWatchTimeRef.current = false;
        return;
      }

      bookmarkIdRef.current = id;
      hasMetMinWatchTimeRef.current = false;

      try {
        const expandedBookmark = await pb.collection("bookmarks").getOne(id, {
          expand: "watchHistory",
          requestKey: null,
        });

        if (!isMounted) return;

        const history = expandedBookmark.expand?.watchHistory as
          | any[]
          | undefined;
        const currentEpNo = parseInt(serversData.episodeNo, 10);
        const existingWatched = history?.find(
          (watched: any) =>
            (currentEpNo && Number(watched.episodeNumber) === currentEpNo) ||
            (watched.episodeId && watched.episodeId === serversData.episodeId),
        );

        if (existingWatched) {
          watchedRecordIdRef.current = existingWatched.id;
          initialSeekTimeRef.current =
            typeof existingWatched.current === "number"
              ? existingWatched.current
              : null;
          hasMetMinWatchTimeRef.current =
            initialSeekTimeRef.current !== null &&
            initialSeekTimeRef.current >= WATCH_PROGRESS_MIN_WATCH_TIME;
          if (
            artInstanceRef.current &&
            initialSeekTimeRef.current &&
            initialSeekTimeRef.current > 0 &&
            artInstanceRef.current.duration > 0 &&
            initialSeekTimeRef.current < artInstanceRef.current.duration - 5 &&
            artInstanceRef.current.currentTime < 5
          ) {
            artInstanceRef.current.seek = initialSeekTimeRef.current;
            initialSeekTimeRef.current = null;
          }
        } else {
          watchedRecordIdRef.current = null;
          initialSeekTimeRef.current = null;
          hasMetMinWatchTimeRef.current = false;
        }
      } catch (e) {
        console.error("Error fetching bookmark watch history:", e);
        if (!isMounted) return;
        watchedRecordIdRef.current = null;
        initialSeekTimeRef.current = null;
        hasMetMinWatchTimeRef.current = false;
      }
    };

    fetchBookmarkAndWatchedId();

    return () => {
      isMounted = false;
    };
  }, [
    auth?.id,
    animeInfo.id,
    serversData.episodeId,
    serversData.episodeNo,
    ensureBookmarkId,
  ]);

  // --- Effect for Player Initialization and Cleanup ---
  useEffect(() => {
    // Wait for container ref and valid URI
    if (!artContainerRef.current || !uri) {
      // Clean up previous instances if URI becomes invalid or ref detach
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (artInstanceRef.current) {
        artInstanceRef.current.destroy(true);
        artInstanceRef.current = null;
      }
      return;
    }

    // Make sure start/end are valid numbers before creating range
    const introStart = episodeInfo?.intro?.start;
    const introEnd = episodeInfo?.intro?.end;
    skipTimesRef.current.validIntro =
      typeof introStart === "number" &&
      typeof introEnd === "number" &&
      introStart < introEnd;
    skipTimesRef.current.introStart = introStart;
    skipTimesRef.current.introEnd = introEnd;

    const outroStart = episodeInfo?.outro?.start;
    const outroEnd = episodeInfo?.outro?.end; // Use let for potential modification
    skipTimesRef.current.validOutro =
      typeof outroStart === "number" &&
      typeof outroEnd === "number" &&
      outroStart < outroEnd; // Adjust condition if needed
    skipTimesRef.current.outroStart = outroStart;
    skipTimesRef.current.outroEnd = outroEnd; // Store the raw value

    // Subtitle Track Selector Options
    const trackOptions: any = (episodeInfo?.subtitles ?? []).map((track) => ({
      default: track.lang === "English" || track.lang === "en",
      html: track.lang,
      url: track.url,
    }));

    const defaultTrack =
      episodeInfo?.subtitles?.find(
        (track) =>
          track.default ||
          track.lang === "English" ||
          track.lang === "en" ||
          track.lang?.toLowerCase().includes("english"),
      )?.url || episodeInfo?.subtitles?.[0]?.url;

    const defaultTrackProxyUrl = defaultTrack
      ? buildStreamProxyUrl({
          url: defaultTrack,
          referer: firstSource?.referer || episodeInfo?.headers?.Referer,
          headers: firstSource?.headers,
        })
      : undefined;

    // Direct Subtitle Option based on subOrDub
    const subtitleConfig: Option["subtitle"] =
      subOrDub === "sub" && defaultTrackProxyUrl
        ? {
            url: defaultTrackProxyUrl,
            type: "vtt",
            style: {
              color: "#FFFFFF",
              fontSize: "22px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            },
            encoding: "utf-8",
            escape: false,
          }
        : {};

    const manualSkipControl = {
      name: "manual-skip", // Unique name
      position: "right", // Place near other controls
      html: `
                <div style="display: flex; align-items: center; gap: 4px; padding: 0 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
                    <span class="art-skip-text">Skip</span>
                </div>
            `, // Icon + Text (use a class for text if needed)
      tooltip: "Skip", // Initial tooltip
      style: {
        display: "none", // Start hidden
        cursor: "pointer",
        borderRadius: "4px",
        marginRight: "10px", // Space from toggle
        padding: "3px 0", // Adjust padding for vertical centering
      },
      click: function(controlItem: any) {
        const art = artInstanceRef.current;
        if (!art) return;
        const { introEnd, outroStart, outroEnd, validIntro, validOutro } =
          skipTimesRef.current;
        const currentTime = art.currentTime;
        const duration = art.duration;

        let seekTarget: number | null = null;
        const resolvedOutroEnd =
          validOutro && outroEnd === 0 && duration > 0 ? duration : outroEnd;

        if (
          validIntro &&
          typeof introEnd === "number" &&
          currentTime >= skipTimesRef.current.introStart! &&
          currentTime < introEnd
        ) {
          seekTarget = introEnd;
        } else if (
          validOutro &&
          typeof outroStart === "number" &&
          typeof resolvedOutroEnd === "number" &&
          currentTime >= outroStart &&
          currentTime < resolvedOutroEnd
        ) {
          // Seek slightly before end if target is duration
          seekTarget =
            resolvedOutroEnd === duration ? duration - 0.1 : resolvedOutroEnd;
        }

        if (typeof seekTarget === "number") {
          art.seek = Math.min(seekTarget, duration); // Seek
        }

        // Hide the button immediately after click
        if (controlItem.style) controlItem.style.display = "none";
      },
    };

    let currentHlsInstanceForCleanup: Hls | null = null;

    // Combine All Options
    const finalOptions: Option = {
      container: artContainerRef.current,
      url: uri,
      type: firstSource?.type === "mp4" ? "mp4" : "m3u8",
      customType: {
        m3u8: (
          videoElement: HTMLMediaElement,
          url: string,
          artPlayerInstance: Artplayer,
        ) => {
          if (Hls.isSupported()) {
            // Destroy previous HLS instance if attached to this player
            if (hlsInstanceRef.current) {
              hlsInstanceRef.current.destroy();
            }
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                console.error("Fatal HLS error encountered:", data);
                if (onError) onError();
              }
            });
            hlsInstanceRef.current = hls; // Store ref
            currentHlsInstanceForCleanup = hls; // Store for cleanup
            // Make sure HLS instance is destroyed when ArtPlayer instance is destroyed
            artPlayerInstance.on("destroy", () => {
              if (hlsInstanceRef.current === hls) {
                hls.destroy();
                hlsInstanceRef.current = null;
                currentHlsInstanceForCleanup = null;
              }
            });
          } else if (
            videoElement.canPlayType("application/vnd.apple.mpegurl")
          ) {
            videoElement.src = url; // Fallback for Safari native HLS
          } else {
            artPlayerInstance.notice.show =
              "HLS playback is not supported on your browser.";
          }
        },
      },
      plugins: [
        artplayerPluginHlsControl({
          // Configure HLS controls
          quality: {
            control: true,
            setting: true,
            getName: (level: { height?: number; bitrate?: number }) =>
              level.height ? `${level.height}P` : "Auto", // Type level
            title: "Quality",
            auto: "Auto",
          },
          audio: {
            control: true,
            setting: true,
            getName: (track: { name?: string }) => track.name ?? "Unknown", // Type track
            title: "Audio",
            auto: "Auto",
          },
        }),
        artplayerPluginAmbilight({
          // Configure Ambilight
          blur: "30", // Use numbers
          opacity: 0.8,
          frequency: 10,
          duration: 0.3,
          zIndex: -1,
        }),
      ],
      settings: [
        // Configure settings panel items
        {
          width: 250,
          html: "Subtitle",
          tooltip: "Subtitle",
          selector: [
            {
              html: "Display",
              tooltip: subOrDub === "sub" ? "Hide" : "Show", // Initial state based on prop
              switch: subOrDub === "sub", // Switch is ON if sub
              onSwitch: function(item) {
                const showSubtitle = !item.switch; // The new state
                art.subtitle.show = showSubtitle;
                item.tooltip = showSubtitle ? "Hide" : "Show";
                console.log(`Subtitle display set to: ${showSubtitle}`);
                return showSubtitle; // Return the new switch state
              },
            },
            ...trackOptions, // Add subtitle track choices
          ],
          onSelect: function(item: any) {
            if (item.url && typeof item.url === "string") {
              const proxiedUrl = buildStreamProxyUrl({
                url: item.url,
                referer: firstSource?.referer || episodeInfo?.headers?.Referer,
                headers: firstSource?.headers,
              });
              art.subtitle.switch(proxiedUrl, {
                name: item.html,
              });
              return item.html ?? "Subtitle";
            }
            return item.html ?? "Subtitle";
          },
        },
      ],
      controls: [manualSkipControl],
      highlight: [
        ...generateHighlights(
          episodeInfo?.intro?.start,
          episodeInfo?.intro?.end,
          "Intro",
        ),
        ...generateHighlights(
          episodeInfo?.outro?.start,
          episodeInfo?.outro?.end,
          "Outro",
        ),
      ],
      poster: animeInfo.image,
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: false,
      autoOrientation: true,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: true,
      setting: true,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#F5316F",
      moreVideoAttr: { crossOrigin: "anonymous" },
      subtitle: subtitleConfig,
      icons: {
        loading: `<img width="60" height="60" src="${loadingImage.src}">`,
      },
    };

    // --- Initialize ArtPlayer ---
    const art = new Artplayer(finalOptions);
    artInstanceRef.current = art;

    // --- Skip Logic Handler ---
    const handleTimeUpdate = () => {
      const art = artInstanceRef.current;
      if (!art || art.loading.show) return;

      const currentTime = art.currentTime;
      const duration = art.duration;
      const {
        introStart,
        introEnd,
        validIntro,
        outroStart,
        outroEnd,
        validOutro,
      } = skipTimesRef.current; // Use ref

      const resolvedOutroEnd =
        validOutro && outroEnd === 0 && duration > 0 ? duration : outroEnd;
      const inIntro =
        validIntro &&
        typeof introStart === "number" &&
        typeof introEnd === "number" &&
        currentTime >= introStart &&
        currentTime < introEnd;
      const inOutro =
        validOutro &&
        typeof outroStart === "number" &&
        typeof resolvedOutroEnd === "number" &&
        currentTime >= outroStart &&
        currentTime < resolvedOutroEnd;

      // Get the manual skip control instance *once* per update
      const manualSkip = art.controls["manual-skip"]; // Access by name

      if (isAutoSkipEnabledRef.current) {
        // Auto Skip Logic
        if (manualSkip?.style?.display !== "none") {
          // Ensure manual button is hidden
          if (manualSkip?.style) manualSkip.style.display = "none";
        }
        if (inIntro && typeof introEnd === "number") {
          art.seek = introEnd;
        } else if (inOutro && typeof resolvedOutroEnd === "number") {
          const seekTarget =
            resolvedOutroEnd === duration ? duration - 0.1 : resolvedOutroEnd;
          art.seek = Math.min(seekTarget, duration);
        }
      } else {
        // Manual Skip Button Logic
        if (!manualSkip) return; // Guard if control not found

        if (inIntro || inOutro) {
          // Show the button
          if (manualSkip.style?.display === "none") {
            if (manualSkip.style) manualSkip.style.display = "inline-flex";
          }
          // Update text/tooltip
          const skipText = inIntro ? "Intro" : "Outro";
          const textElement = manualSkip.querySelector(".art-skip-text");
          if (textElement && textElement.textContent !== `Skip ${skipText}`) {
            textElement.textContent = `Skip ${skipText}`;
          }
        } else {
          // Hide the button
          if (manualSkip.style?.display !== "none") {
            if (manualSkip.style) manualSkip.style.display = "none";
          }
        }
      }

      // --- Watch Progress Tracking ---
      // 1. Check if minimum watch time is met to potentially create record
      if (
        !hasMetMinWatchTimeRef.current &&
        currentTime >= WATCH_PROGRESS_MIN_WATCH_TIME &&
        duration > 0
      ) {
        hasMetMinWatchTimeRef.current = true;
        if (!watchedRecordIdRef.current) {
          lastUpdateTimeRef.current = Date.now();
          void ensureBookmarkAndSync(currentTime, duration);
        }
      }

      // 2. Throttle updates every 10s if playing and min time met OR record already exists
      if (
        duration > 0 &&
        (hasMetMinWatchTimeRef.current || watchedRecordIdRef.current) &&
        Date.now() - lastUpdateTimeRef.current > WATCH_PROGRESS_UPDATE_INTERVAL
      ) {
        lastUpdateTimeRef.current = Date.now();
        void ensureBookmarkAndSync(currentTime, duration);
      }
    };

    // --- Event Listeners ---
    art.on("ready", () => {
      art.subtitle.style({
        fontSize: art.height * 0.04 + "px",
      });
      // --- SEEK TO LAST POSITION ---
      const seekTime = initialSeekTimeRef.current;
      if (
        seekTime !== null &&
        seekTime > 0 &&
        art.duration > 0 &&
        seekTime < art.duration - 5
      ) {
        setTimeout(() => {
          if (artInstanceRef.current) {
            artInstanceRef.current.seek = seekTime;
          }
        }, 100);
        initialSeekTimeRef.current = null;
      } else {
        initialSeekTimeRef.current = null;
      }
    });

    art.on("resize", () => {
      if (!artInstanceRef.current) return;
      const newSize = Math.max(
        14,
        Math.min(32, artInstanceRef.current.height * 0.04),
      );
      artInstanceRef.current.subtitle.style({ fontSize: `${newSize}px` });
    });

    art.on("error", (error, reconnectTime) => {
      console.error(
        "ArtPlayer Error:",
        error,
        "Reconnect attempt:",
        reconnectTime,
      );
      if (onError) onError();
    });

    art.on("video:timeupdate", handleTimeUpdate);

    const handleInteractionUpdate = () => {
      const art = artInstanceRef.current;
      if (!art || !art.duration || art.duration <= 0) return;
      if (
        hasMetMinWatchTimeRef.current ||
        watchedRecordIdRef.current ||
        art.currentTime >= WATCH_PROGRESS_MIN_WATCH_TIME
      ) {
        hasMetMinWatchTimeRef.current = true;
        if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
        lastUpdateTimeRef.current = Date.now();
        void ensureBookmarkAndSync(art.currentTime, art.duration);
      }
    };
    art.on("video:pause", handleInteractionUpdate);
    art.on("video:seeked", handleInteractionUpdate);
    art.on("video:ended", handleInteractionUpdate);

    // --- Callback for Parent ---
    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }

    // --- Cleanup Function ---
    return () => {
      const art = artInstanceRef.current;
      const hls = hlsInstanceRef.current;

      if (hls) {
        if (hls.media) {
          hls.detachMedia();
        }
        hls.destroy();
        hlsInstanceRef.current = null;
      }

      if (
        art &&
        art.duration > 0 &&
        (hasMetMinWatchTimeRef.current || watchedRecordIdRef.current)
      ) {
        void ensureBookmarkAndSync(art.currentTime, art.duration);
      }

      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }

      if (art) {
        art.off("video:pause", handleInteractionUpdate);
        art.off("video:seeked", handleInteractionUpdate);
        art.off("video:ended", handleInteractionUpdate);
        art.off("video:timeupdate", handleTimeUpdate);

        art.pause();

        if (art.video) {
          art.video.removeAttribute("src");
          art.video.load();
        }

        if (currentHlsInstanceForCleanup) {
          currentHlsInstanceForCleanup.destroy();
          if (hlsInstanceRef.current === currentHlsInstanceForCleanup) {
            hlsInstanceRef.current = null;
          }
          currentHlsInstanceForCleanup = null;
        } else if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
          hlsInstanceRef.current = null;
        }

        art.destroy(true);
        if (artInstanceRef.current === art) {
          artInstanceRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, subOrDub]);

  // --- Render ---
  return (
    <div
      className={cn(
        "relative w-full h-auto aspect-video  min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden", // Added relative and overflow-hidden
        rest.className ?? "",
      )}
    >
      <div ref={artContainerRef} className="w-full h-full">
        {!uri && (
          <div
            className="w-full h-full flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${animeInfo.image})` }}
          >
            <Image
              width="60"
              height="60"
              src={loadingImage.src}
              alt="Loading..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default KitsunePlayer;
