"use client";

import React, { useEffect, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";
import dynamic from "next/dynamic";

const KitsunePlayer = dynamic(() => import("@/components/kitsune-player"), {
  ssr: false,
});
import { useGetEpisodeData } from "@/query/get-episode-data";
import {
  Captions,
  Mic,
  AlertCircle,
  Tv,
  ShieldCheck,
  Download,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useGetAllEpisodes } from "@/query/get-all-episodes";
import useBookMarks from "@/hooks/use-get-bookmark";
import { useGetSourceAvailable } from "@/query/get-source-available";
import {
  COMPANION_DOWNLOAD_URL,
  COMPANION_UI_URL,
  detectLocalProxy,
} from "@/lib/local-proxy";

const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const animeIdParam = searchParams.get("anime") || "";
  const epParam = searchParams.get("ep");
  const episodeIdParam = searchParams.get("episode") || "";
  const { selectedEpisode, setSelectedEpisode, anime } = useAnimeStore();

  const { data: isSourceAvailable } = useGetSourceAvailable();
  const { data: allEpisodesData, isLoading: isLoadingEpisodes } =
    useGetAllEpisodes(animeIdParam);

  const [localProxyActive, setLocalProxyActive] = useState<boolean>(false);

  useEffect(() => {
    detectLocalProxy().then(setLocalProxyActive);
  }, []);

  // Match episode number from ?ep= parameter if present
  const targetEpByNumber =
    epParam && allEpisodesData?.episodes
      ? allEpisodesData.episodes.find((e) => e.number === Number(epParam))
      : null;

  // Resolve active episode ID prioritizing selectedEpisode or ?ep= parameter
  const activeEpisodeId =
    selectedEpisode ||
    targetEpByNumber?.episodeId ||
    episodeIdParam ||
    allEpisodesData?.episodes?.[0]?.episodeId ||
    "";

  // Sync selectedEpisode in store when ?ep= parameter changes
  useEffect(() => {
    if (!targetEpByNumber?.episodeId) return;
    const parts = (selectedEpisode || "").replace(/^\//, "").split("/");
    const selEpNum = parts[4] ? Number(parts[4].split("-").pop()) : Number(selectedEpisode);
    if (!selectedEpisode || selEpNum !== targetEpByNumber.number) {
      const providers = allEpisodesData?.rawResponse?.providers || {};
      const curProv = parts[1];
      const curCat = (parts[3] === "dub" ? "dub" : "sub") as "sub" | "dub";
      const matchInCurProv = curProv
        ? providers[curProv]?.episodes?.[curCat]?.find(
            (e: any) => Number(e.number) === targetEpByNumber.number,
          )
        : null;
      setSelectedEpisode(matchInCurProv?.id || targetEpByNumber.episodeId);
      setUseFallback(false);
    }
  }, [
    targetEpByNumber?.episodeId,
    targetEpByNumber?.number,
    selectedEpisode,
    allEpisodesData?.rawResponse?.providers,
    setSelectedEpisode,
  ]);

  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [failedEpisodeIds, setFailedEpisodeIds] = useState<Set<string>>(new Set());

  const { data: episodeData, isLoading: isLoadingData } = useGetEpisodeData(
    activeEpisodeId,
    !useFallback && activeEpisodeId.includes("watch/"),
  );

  const [autoSkip, setAutoSkip] = useState<boolean>(true);
  const [preferredCategory, setPreferredCategory] = useState<"sub" | "dub">("sub");

  const { createOrUpdateBookMark, syncWatchProgress } = useBookMarks({
    animeID: animeIdParam,
    populate: false,
  });

  const fallbackBookmarkIdRef = React.useRef<string | null>(null);
  const fallbackWatchedRecordIdRef = React.useRef<string | null>(null);
  const lastSyncedTimeRef = React.useRef<number>(0);

  useEffect(() => {
    const storedSkip = localStorage.getItem("autoSkip");
    if (storedSkip !== null) setAutoSkip(storedSkip === "true");

    const storedCategory = localStorage.getItem("preferredCategory");
    if (storedCategory === "sub" || storedCategory === "dub") {
      setPreferredCategory(storedCategory);
    }
  }, []);

  function onHandleAutoSkipChange(value: boolean) {
    setAutoSkip(value);
    localStorage.setItem("autoSkip", JSON.stringify(value));
  }

  // Extract dynamic providers from EpisodeResponse
  const rawProviders = React.useMemo(
    () => allEpisodesData?.rawResponse?.providers || {},
    [allEpisodesData?.rawResponse?.providers],
  );
  const providerNames = React.useMemo(
    () => Object.keys(rawProviders),
    [rawProviders],
  );

  // Cleanly extract active provider, category, and episode number
  const cleanParts = activeEpisodeId.replace(/^\//, "").split("/");
  const currentProviderName = cleanParts[1] || providerNames[0] || "";
  const activeCategory: "sub" | "dub" =
    cleanParts[3] === "dub" ? "dub" : preferredCategory;

  const parsedEpFromSlug = cleanParts[4]
    ? Number(cleanParts[4].split("-").pop())
    : NaN;
  const currentEpNumber =
    allEpisodesData?.episodes?.find((e) => e.episodeId === activeEpisodeId)
      ?.number ||
    (Number.isFinite(parsedEpFromSlug) && parsedEpFromSlug > 0
      ? parsedEpFromSlug
      : Number(epParam) || 1);

  // Reset failed providers when switching to a different episode number
  useEffect(() => {
    setFailedEpisodeIds(new Set());
  }, [currentEpNumber, animeIdParam]);

  // Synchronize activeEpisodeId category with preferredCategory ("sub" or "dub")
  useEffect(() => {
    if (!providerNames.length || !activeEpisodeId.includes("watch/")) return;

    const slugCategory = cleanParts[3] === "dub" ? "dub" : "sub";
    if (slugCategory !== preferredCategory) {
      for (const pName of providerNames) {
        const pData = rawProviders[pName]?.episodes?.[preferredCategory] || [];
        const targetEp = pData.find(
          (ep: any) => Number(ep.number) === currentEpNumber,
        );
        if (targetEp?.id) {
          setSelectedEpisode(targetEp.id);
          break;
        }
      }
    }
  }, [
    currentEpNumber,
    preferredCategory,
    providerNames,
    rawProviders,
    activeEpisodeId,
    cleanParts,
    setSelectedEpisode,
  ]);

  // Try next available provider when current provider fails or returns 0 streams
  const tryNextProviderOrFallback = React.useCallback(() => {
    const nextFailed = new Set(failedEpisodeIds);
    if (activeEpisodeId) nextFailed.add(activeEpisodeId);
    setFailedEpisodeIds(nextFailed);

    for (const pName of providerNames) {
      const pData = rawProviders[pName]?.episodes?.[activeCategory] || [];
      const candidate = pData.find(
        (ep: any) => Number(ep.number) === currentEpNumber,
      );
      if (candidate?.id && !nextFailed.has(candidate.id)) {
        setSelectedEpisode(candidate.id);
        return;
      }
    }
    setUseFallback(true);
  }, [
    failedEpisodeIds,
    activeEpisodeId,
    providerNames,
    rawProviders,
    activeCategory,
    currentEpNumber,
    setSelectedEpisode,
  ]);

  // Auto-advance if non-loading episodeData returned 0 playable sources
  useEffect(() => {
    if (
      !useFallback &&
      !isLoadingData &&
      activeEpisodeId.includes("watch/") &&
      episodeData &&
      (!episodeData.sources || episodeData.sources.length === 0)
    ) {
      tryNextProviderOrFallback();
    }
  }, [
    useFallback,
    isLoadingData,
    activeEpisodeId,
    episodeData,
    tryNextProviderOrFallback,
  ]);

  const isFallbackActive =
    useFallback ||
    !activeEpisodeId.includes("watch/") ||
    (!isLoadingData && (!episodeData || !episodeData.sources?.length));

  // Listen to postMessage events from Fallback Player iframe (megaplay.buzz)
  useEffect(() => {
    fallbackWatchedRecordIdRef.current = null;
    lastSyncedTimeRef.current = 0;

    if (!isFallbackActive || !animeIdParam || !activeEpisodeId) return;

    let isMounted = true;

    const initBookmark = async () => {
      const animeName = anime?.anime?.info?.name || "Anime";
      const poster = anime?.anime?.info?.poster || "";
      const bId = await createOrUpdateBookMark(
        animeIdParam,
        animeName,
        poster,
        "watching",
        false,
      );
      if (isMounted) {
        fallbackBookmarkIdRef.current = bId;
      }
    };

    initBookmark();

    const handleIframeMessage = async (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== "object") return;

      let currentTime: number | null = null;
      let duration: number | null = null;

      if (typeof data.currentTime === "number") {
        currentTime = data.currentTime;
      } else if (typeof data.time === "number") {
        currentTime = data.time;
      }

      if (typeof data.duration === "number") {
        duration = data.duration;
      }

      const isComplete = data.event === "complete";

      if (currentTime !== null && duration !== null && duration > 0) {
        const now = Math.floor(currentTime);
        if (isComplete || Math.abs(now - lastSyncedTimeRef.current) >= 10) {
          lastSyncedTimeRef.current = now;

          if (fallbackBookmarkIdRef.current) {
            const recordId = await syncWatchProgress(
              fallbackBookmarkIdRef.current,
              fallbackWatchedRecordIdRef.current,
              {
                episodeId: activeEpisodeId,
                episodeNumber: Number(currentEpNumber) || 1,
                current: currentTime,
                duration: duration,
              },
            );
            if (recordId && isMounted) {
              fallbackWatchedRecordIdRef.current = recordId;
            }
          }
        }
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      isMounted = false;
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [
    isFallbackActive,
    activeEpisodeId,
    animeIdParam,
    anime,
    currentEpNumber,
    createOrUpdateBookMark,
    syncWatchProgress,
  ]);

  const handleProviderSelect = (pName: string, category: "sub" | "dub") => {
    setPreferredCategory(category);
    localStorage.setItem("preferredCategory", category);
    setUseFallback(false);

    const pData = rawProviders[pName]?.episodes?.[category] || [];
    const targetEp =
      pData.find((ep: any) => Number(ep.number) === currentEpNumber) || pData[0];
    if (targetEp?.id) {
      setFailedEpisodeIds((prev) => {
        const next = new Set(prev);
        next.delete(targetEp.id);
        return next;
      });
      setSelectedEpisode(targetEp.id);
    }
  };

  if (!activeEpisodeId || isLoadingEpisodes || (isLoadingData && !useFallback)) {
    return (
      <div className="h-auto aspect-video lg:max-h-[calc(100vh-150px)] min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] w-full animate-pulse bg-slate-800 rounded-xl"></div>
    );
  }

  const subProvidersForEp = providerNames.filter((pName) =>
    (rawProviders[pName]?.episodes?.sub || []).some(
      (ep: any) => Number(ep.number) === currentEpNumber,
    ),
  );
  const dubProvidersForEp = providerNames.filter((pName) =>
    (rawProviders[pName]?.episodes?.dub || []).some(
      (ep: any) => Number(ep.number) === currentEpNumber,
    ),
  );

  const nextAiring = allEpisodesData?.nextAiringEpisode;
  const nextAiringDays = nextAiring
    ? Math.floor(nextAiring.timeUntilAiring / 86400)
    : 0;
  const nextAiringHours = nextAiring
    ? Math.floor((nextAiring.timeUntilAiring % 86400) / 3600)
    : 0;

  const fallbackAnimeId = animeIdParam || anime?.anime?.info?.id || "1";
  const fallbackEpId = currentEpNumber || "1";
  const fallbackSrc = `https://megaplay.buzz/stream/ani/${fallbackAnimeId}/${fallbackEpId}/${activeCategory}`;

  return (
    <div className="flex flex-col gap-3 w-full">
      {isFallbackActive || !episodeData ? (
        <div className="relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden rounded-xl border border-slate-800">
          <iframe
            key={`${fallbackAnimeId}-${fallbackEpId}-${activeCategory}`}
            src={fallbackSrc}
            width="100%"
            height="100%"
            allowFullScreen
            className="w-full h-full border-0"
          ></iframe>
        </div>
      ) : (
        <KitsunePlayer
          key={`${activeEpisodeId}-${episodeData.sources?.[0]?.url}`}
          episodeInfo={episodeData}
          serversData={{
            episodeId: activeEpisodeId,
            episodeNo: String(currentEpNumber),
            sub: subProvidersForEp.map((p, idx) => ({
              serverId: idx + 1,
              serverName: p,
            })),
            dub: dubProvidersForEp.map((p, idx) => ({
              serverId: idx + 1,
              serverName: p,
            })),
            raw: [],
          }}
          animeInfo={{
            id: String(animeIdParam || anime?.anime?.info?.id || "0"),
            title: anime?.anime?.info?.name || "Anime",
            image: anime?.anime?.info?.poster || "",
          }}
          subOrDub={activeCategory}
          autoSkip={autoSkip}
          onError={tryNextProviderOrFallback}
        />
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full p-5 bg-[#0f172a] border border-slate-800 rounded-xl">
        <div className="flex flex-col gap-3 w-full md:w-auto">
          {subProvidersForEp.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Captions className="text-red-400 h-4 w-4 shrink-0" />
              <p className="font-bold text-xs text-gray-300 tracking-wider">
                SERVERS (SUB):
              </p>
              {subProvidersForEp.map((pName) => {
                const isActive =
                  !isFallbackActive &&
                  currentProviderName.toLowerCase() === pName.toLowerCase() &&
                  activeCategory === "sub";

                return (
                  <Button
                    size="sm"
                    key={`sub-${pName}`}
                    className={`uppercase font-bold text-xs px-3 transition-all ${
                      isActive
                        ? "bg-[#e9376b] text-white shadow-md ring-2 ring-[#e9376b]/40 scale-105"
                        : "bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    onClick={() => handleProviderSelect(pName, "sub")}
                  >
                    {pName}
                  </Button>
                );
              })}
            </div>
          )}

          {dubProvidersForEp.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Mic className="text-green-400 h-4 w-4 shrink-0" />
              <p className="font-bold text-xs text-gray-300 tracking-wider">
                SERVERS (DUB):
              </p>
              {dubProvidersForEp.map((pName) => {
                const isActive =
                  !isFallbackActive &&
                  currentProviderName.toLowerCase() === pName.toLowerCase() &&
                  activeCategory === "dub";

                return (
                  <Button
                    size="sm"
                    key={`dub-${pName}`}
                    className={`uppercase font-bold text-xs px-3 transition-all ${
                      isActive
                        ? "bg-green-600 text-white shadow-md ring-2 ring-green-500/40 scale-105"
                        : "bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    onClick={() => handleProviderSelect(pName, "dub")}
                  >
                    {pName}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm shrink-0 self-start md:self-auto">
          {localProxyActive && (
            <a
              href={COMPANION_UI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Companion Active
              <ExternalLink className="h-3 w-3 opacity-75" />
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (isFallbackActive && subProvidersForEp.length > 0) {
                handleProviderSelect(subProvidersForEp[0], "sub");
              } else {
                setUseFallback(true);
              }
            }}
            className="h-8 px-3 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-gray-200 flex items-center gap-1.5"
          >
            <Tv className="h-3.5 w-3.5 text-yellow-400" />
            {isFallbackActive && subProvidersForEp.length > 0
              ? "Switch to Primary Player"
              : "Switch to Fallback Player"}
          </Button>
          {!isFallbackActive && (
            <div className="flex flex-row items-center space-x-2">
              <Switch
                checked={autoSkip}
                onCheckedChange={(e) => onHandleAutoSkipChange(e)}
                id="auto-skip"
              />
              <p>Auto Skip</p>
            </div>
          )}
        </div>
      </div>

      {isFallbackActive && (
        <Alert
          variant="destructive"
          className="border-amber-800/80 bg-amber-950/40 text-amber-200 rounded-xl"
        >
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <AlertTitle className="font-bold">
                Fallback Video Player Activated
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-200/80 mt-1">
                The primary video player is unavailable for this stream.
                Download the{" "}
                <strong className="text-amber-100">Kitsune Companion</strong>{" "}
                app for a smooth, ad-free experience in the primary player.
              </AlertDescription>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-[#e9376b] hover:bg-[#d42d5e] text-white font-semibold text-xs px-3.5 h-8 shadow-sm"
            >
              <a
                href={COMPANION_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download Companion App
              </a>
            </Button>
          </div>
        </Alert>
      )}

      {nextAiring && nextAiring.timeUntilAiring > 0 && (
        <Alert className="border-indigo-800/80 bg-indigo-950/40 text-indigo-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-indigo-400" />
          <AlertTitle className="font-bold">
            Episode {nextAiring.episode} Airing Soon
          </AlertTitle>
          <AlertDescription className="text-xs text-indigo-200/80 mt-1">
            Next episode airs in{" "}
            {nextAiringDays > 0 ? `${nextAiringDays}d ` : ""}
            {nextAiringHours}h.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VideoPlayerSection;
