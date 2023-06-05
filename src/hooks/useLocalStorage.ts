import { TWatchedAnime } from "@/@types/AnimeType";

export default function useLocalStorage() {
  function getKitsuneWatched() {
    if (typeof window !== "undefined") {
      let watched = localStorage.getItem("watched");
      if (watched !== null) {
        let result = JSON.parse(watched);
        return result.watched;
      }
      return null;
    }
    return null;
  }

  function getKitsuneWatchedId(id: string) {
    if (typeof window !== "undefined") {
      let watched = localStorage.getItem("watched");
      if (watched !== null) {
        let result = JSON.parse(watched);
        return result.watched[id];
      }
      return null;
    }
    return null;
  }

  function setKitsuneWatched({
    id,
    title,
    image,
    ep,
  }: {
    id: string;
    title: string;
    image: string;
    ep: { id: string; number: number };
  }) {
    if (typeof window !== "undefined") {
      let watched = localStorage.getItem("watched");
      if (watched) {
        let result = JSON.parse(watched);
        if (result.watched[id]) {
          let toSave: TWatchedAnime = result.watched[id];
          if (!toSave.ep.some((anime) => anime.id === ep.id)) {
            toSave.ep.push(ep);
            result.watched[id] = toSave;
            localStorage.setItem("watched", JSON.stringify(result));
          }
        } else {
          let toSave: TWatchedAnime = {
            id,
            title,
            image,
            ep: [
              {
                id: ep.id,
                number: ep.number,
              },
            ],
          };
          result.watched[id] = toSave;

          localStorage.setItem("watched", JSON.stringify(result));
        }
      } else {
        let info: TWatchedAnime = {
          id,
          title,
          image,
          ep: [
            {
              id: ep.id,
              number: ep.number,
            },
          ],
        };
        let toSave = {
          watched: {
            [id]: info,
          },
        };

        localStorage.setItem("watched", JSON.stringify(toSave));
      }
    }
  }

  function delKitsuneWatched(id: string) {
    let watched = getKitsuneWatched();
    delete watched[id];
    localStorage.setItem("watched", JSON.stringify({ watched }));
  }

  return {
    getKitsuneWatched,
    setKitsuneWatched,
    getKitsuneWatchedId,
    delKitsuneWatched,
  };
}
