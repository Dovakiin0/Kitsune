"use client";

import React, { useEffect, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";

import { IWatchedAnime } from "@/types/watched-anime";
// import KitsunePlayer from "@/components/kitsune-player";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useGetEpisodeServers } from "@/query/get-episode-servers";
import { getFallbackServer } from "@/utils/fallback-server";
import { AlertCircleIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/auth-store";
// import { pb } from "@/lib/pocketbase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";

const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const episodeId = searchParams.get("episode");
  const { selectedEpisode, anime } = useAnimeStore();

  const { data: serversData } = useGetEpisodeServers(selectedEpisode);

  const [serverName, setServerName] = useState<string>("");
  const [key, setKey] = useState<string>("");

  const { auth } = useAuthStore();
  // const [autoSkip, setAutoSkip] = useState<boolean>(
  //   auth?.autoSkip || Boolean(localStorage.getItem("autoSkip")) || false,
  // );

  useEffect(() => {
    const { serverName, key } = getFallbackServer(serversData);
    setServerName(serverName);
    setKey(key);
  }, [serversData]);

  const { data: episodeData } = useGetEpisodeData(
    selectedEpisode,
    serverName,
    key,
  );

  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    JSON.parse(localStorage.getItem("watched") as string) || [],
  );

  // function changeServer(serverName: string, key: string) {
  //   setServerName(serverName);
  //   setKey(key);
  //   const preference = { serverName, key };
  //   localStorage.setItem("serverPreference", JSON.stringify(preference));
  // }

  // async function onHandleAutoSkipChange(value: boolean) {
  //   setAutoSkip(value);
  //   if (!auth) {
  //     localStorage.setItem("autoSkip", JSON.stringify(value));
  //     return;
  //   }
  //   const res = await pb.collection("users").update(auth.id, {
  //     autoSkip: value,
  //   });
  //   if (res) {
  //     setAuth({ ...auth, autoSkip: value });
  //   }
  // }

  useEffect(() => {
    if (auth) return;
    if (!Array.isArray(watchedDetails)) {
      localStorage.removeItem("watched");
      return;
    }

    if (episodeData) {
      const existingAnime = watchedDetails.find(
        (watchedAnime) => watchedAnime.anime.id === anime.anime.info.id,
      );

      if (!existingAnime) {
        // Add new anime entry if it doesn't exist
        const updatedWatchedDetails = [
          ...watchedDetails,
          {
            anime: {
              id: anime.anime.info.id,
              title: anime.anime.info.name,
              poster: anime.anime.info.poster,
            },
            episodes: [selectedEpisode],
          },
        ];
        localStorage.setItem("watched", JSON.stringify(updatedWatchedDetails));
        setWatchedDetails(updatedWatchedDetails);
      } else {
        // Update the existing anime entry
        const episodeAlreadyWatched =
          existingAnime.episodes.includes(selectedEpisode);

        if (!episodeAlreadyWatched) {
          // Add the new episode to the list
          const updatedWatchedDetails = watchedDetails.map((watchedAnime) =>
            watchedAnime.anime.id === anime.anime.info.id
              ? {
                ...watchedAnime,
                episodes: [...watchedAnime.episodes, selectedEpisode],
              }
              : watchedAnime,
          );

          localStorage.setItem(
            "watched",
            JSON.stringify(updatedWatchedDetails),
          );
          setWatchedDetails(updatedWatchedDetails);
        }
      }
    }
    //eslint-disable-next-line
  }, [episodeData, selectedEpisode, auth]);

  /** 
  Temporary fallback player for now
  **/
  return episodeId && (
    <>
      <div
        className={
          "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
        }
      >
        <iframe
          src={`https://megaplay.buzz/stream/s-2/${episodeId.split("?ep=")[1]}/sub`}
          width="100%"
          height="100%"
          allowFullScreen
        ></iframe>
      </div>
      <div className="mt-4">
        <Alert variant="destructive" className="text-red-400">
          <AlertTitle className="font-bold flex items-center space-x-2">
            <AlertCircleIcon size="20" />
            <p>Fallback Video Player Activated</p>
          </AlertTitle>
          <AlertDescription>
            The original video source for this episode is currently unavailable.
            A fallback player has been provided for your convenience. We
            recommend using an ad blocker for a smoother viewing experience.
          </AlertDescription>
        </Alert>
      </div>
    </>
  );

  // if (isLoading || !episodeData)
  //   return (
  //     <div className="h-auto aspect-video lg:max-h-[calc(100vh-150px)] min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] w-full animate-pulse bg-slate-700 rounded-md"></div>
  //   );
  //
  // return !episodeData || episodeData?.sources.length === 0 ? (
  //   <>
  //     <div
  //       className={
  //         "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
  //       }
  //     >
  //       <iframe
  //         src={`https://megaplay.buzz/stream/s-2/${serversData?.episodeId.split("?ep=")[1]}/sub`}
  //         width="100%"
  //         height="100%"
  //         allowFullScreen
  //       ></iframe>
  //     </div>
  //     <div className="mt-4">
  //       <Alert variant="destructive" className="text-red-400">
  //         <AlertTitle className="font-bold flex items-center space-x-2">
  //           <AlertCircleIcon size="20" />
  //           <p>Fallback Video Player Activated</p>
  //         </AlertTitle>
  //         <AlertDescription>
  //           The original video source for this episode is currently unavailable.
  //           A fallback player has been provided for your convenience. We
  //           recommend using an ad blocker for a smoother viewing experience.
  //         </AlertDescription>
  //       </Alert>
  //     </div>
  //   </>
  // ) : (
  //   <div>
  //     <KitsunePlayer
  //       key={episodeData?.sources?.[0].url}
  //       episodeInfo={episodeData!}
  //       serversData={serversData!}
  //       animeInfo={{
  //         id: anime.anime.info.id,
  //         title: anime.anime.info.name,
  //         image: anime.anime.info.poster,
  //       }}
  //       subOrDub={key as "sub" | "dub"}
  //       autoSkip={autoSkip}
  //     />
  //     <div className="flex flex-row bg-[#0f172a]  items-start justify-between w-full p-5">
  //       <div>
  //         <div className="flex flex-row items-center space-x-5">
  //           <Captions className="text-red-300" />
  //           <p className="font-bold text-sm">SUB</p>
  //           {serversData?.sub.map((s, i) => (
  //             <Button
  //               size="sm"
  //               key={i}
  //               className={`uppercase font-bold ${serverName === s.serverName && key === "sub" && "bg-red-300"}`}
  //               onClick={() => changeServer(s.serverName, "sub")}
  //             >
  //               {s.serverName}
  //             </Button>
  //           ))}
  //         </div>
  //         {!!serversData?.dub.length && (
  //           <div className="flex flex-row items-center space-x-5 mt-2">
  //             <Mic className="text-green-300" />
  //             <p className="font-bold text-sm">DUB</p>
  //             {serversData?.dub.map((s, i) => (
  //               <Button
  //                 size="sm"
  //                 key={i}
  //                 className={`uppercase font-bold ${serverName === s.serverName && key === "dub" && "bg-green-300"}`}
  //                 onClick={() => changeServer(s.serverName, "dub")}
  //               >
  //                 {s.serverName}
  //               </Button>
  //             ))}
  //           </div>
  //         )}
  //       </div>
  //       <div className="flex flex-row items-center space-x-2 text-sm">
  //         <Switch
  //           checked={autoSkip}
  //           onCheckedChange={(e) => onHandleAutoSkipChange(e)}
  //           id="auto-skip"
  //         />
  //         <p>Auto Skip</p>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default VideoPlayerSection;
