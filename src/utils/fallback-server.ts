export function getFallbackServer(serversData: any): {
  serverName: string;
  key: string;
} {
  const keys = ["sub", "dub", "raw"];
  for (const key of keys) {
    if (serversData?.[key]?.[0]?.serverName) {
      return {
        serverName: serversData[key][0].serverName,
        key,
      };
    }
  }
  return {
    serverName: "",
    key: "",
  }; // No valid server found
}
