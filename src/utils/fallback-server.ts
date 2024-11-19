import { IEpisodeServers } from "@/types/episodes";

export function getFallbackServer(serversData: IEpisodeServers | undefined): {
  serverName: string;
  key: string;
} {
  if (serversData) {
    const keys: Array<"sub" | "dub" | "raw"> = ["sub", "dub", "raw"]; // Only valid keys
    for (const key of keys) {
      const serverList = serversData[key]; // Safely index the object
      if (serverList && serverList[0]?.serverName) {
        return {
          serverName: serverList[0].serverName,
          key,
        };
      }
    }
  }
  return {
    serverName: "",
    key: "",
  }; // Fallback if no valid server is found
}
