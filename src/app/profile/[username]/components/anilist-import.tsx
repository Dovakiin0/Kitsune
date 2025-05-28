import React from "react";
import AnilistIcon from "@/icons/anilist";
import Button from "@/components/common/custom-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGetAnilistAnimes } from "@/mutation/get-anilist-animes";
import { toast } from "sonner";
import { AnilistMediaList } from "@/types/anilist-animes";
import { api } from "@/lib/api";
import useBookMarks from "@/hooks/use-get-bookmark";
import { Badge } from "@/components/ui/badge";

function AnilistImport() {
  const getAnilistAnime = useGetAnilistAnimes();
  const [username, setUsername] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [animes, setAnimes] = React.useState<AnilistMediaList[]>([]);
  const bookmark = useBookMarks({ populate: false });
  const [open, setOpen] = React.useState(false);

  const onSubmitStepOne = async () => {
    if (!username || username.trim() === "") {
      toast.warning("Please enter a valid Anilist username", {
        style: { background: "orange" },
      });
      return;
    }
    setIsLoading(true);

    try {
      const data = await getAnilistAnime.mutateAsync(username);
      if (data) {
        setAnimes(data.MediaListCollection.lists);
        setStep(2);
      }
    } catch (error) {
      console.error("Error importing Anilist anime:", error);
      toast.error("Failed to import Anilist anime", {
        style: { background: "red" },
      });
    }

    setIsLoading(false);
  };

  const onSubmitStepTwo = async () => {
    if (animes.length === 0) {
      toast.warning("No animes to import", {
        style: { background: "orange" },
      });
      return;
    }
    setIsLoading(true);

    try {
      const { data } = await api.post("/api/import/anilist", {
        animes,
      });
      if (!data || !data.animes) {
        toast.error("No anime found", {
          style: { background: "red" },
        });
        setIsLoading(false);
        return;
      }

      // update in pb
      const animeList = data.animes;
      for (const anime of animeList) {
        await bookmark.createOrUpdateBookMark(
          anime.id,
          anime.title,
          anime.thumbnail,
          anime.status,
          false,
        );
      }

      toast.success("Anilist anime imported successfully", {
        style: { background: "green" },
      });
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Error importing Anilist anime:", error);
      toast.error("Failed to import Anilist anime", {
        style: { background: "red" },
      });
    }

    setIsLoading(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      reset();
    }
    setOpen(val);
  };

  const reset = () => {
    setUsername("");
    setIsLoading(false);
    setStep(1);
    setAnimes([]);
  };

  return (
    <>
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogTrigger onClick={() => setOpen(true)}>
          <AnilistIcon />
        </DialogTrigger>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Import from Anilist
              <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                Beta
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Please note that import from Anilist is a beta feature and may not
              succeed if you have a large number of animes in your list.
            </DialogDescription>
          </DialogHeader>
          {step === 1 && (
            <>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Enter Anilist Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  loading={isLoading}
                  disabled={isLoading}
                  size="sm"
                  className="bg-[#e9376b]  hover:bg-[#e9376b] text-white"
                  type="submit"
                  onClick={onSubmitStepOne}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-md font-semibold mb-2">
                  Following animes will be imported:
                </h2>
              </div>
              <div>
                <ul className="list-disc pl-5">
                  {animes.map((anime) => (
                    <li key={anime.name} className="mb-2">
                      <span className="font-semibold">{anime.name}:</span>{" "}
                      {anime.entries.length} entries
                    </li>
                  ))}
                </ul>
              </div>
              <DialogFooter className="items-center">
                {isLoading && (
                  <p className="text-xs text-gray-400">
                    Please be patient as it may take some while to import
                  </p>
                )}
                <Button
                  loading={isLoading}
                  disabled={isLoading}
                  size="sm"
                  className="bg-[#e9376b]  hover:bg-[#e9376b] text-white"
                  type="submit"
                  onClick={onSubmitStepTwo}
                >
                  Import
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AnilistImport;
