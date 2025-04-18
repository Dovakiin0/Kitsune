import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/store/auth-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  animeID?: string;
  status?: string;
  page?: number;
  per_page?: number;
  populate?: boolean;
};

export type Bookmark = {
  id: string;
  user: string;
  animeId: string;
  thumbnail: string;
  animeTitle: string;
  status: string;
  created: string;
  expand: {
    watchHistory: WatchHistory[];
  };
};

export type WatchHistory = {
  current: number;
  timestamp: number;
  episodeId: string;
  episodeNumber: number;
};

function useBookMarks({
  animeID,
  status,
  page,
  per_page,
  populate = true,
}: Props) {
  const { auth } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);

  const filterParts = [];

  if (animeID) {
    filterParts.push(`animeId='${animeID}'`);
  }

  if (status) {
    filterParts.push(`status='${status}'`);
  }

  // Join the parts with ' && '
  const filters = filterParts.join(" && ");

  useEffect(() => {
    if (!populate) return;
    const getBookmarks = async () => {
      const res = await pb
        .collection<Bookmark>("bookmarks")
        .getList(page, per_page, {
          filter: filters,
          expand: "watchHistory",
        });

      if (res.totalItems > 0) {
        const bookmark = res.items;
        setBookmarks(bookmark);
      } else {
        setBookmarks(null);
      }
    };

    getBookmarks();
  }, [animeID, status, page, per_page, filters]);

  const createOrUpdateBookMark = async (
    animeID: string,
    animeTitle: string,
    animeThumbnail: string,
    status: string,
    showToast: boolean = true,
  ): Promise<string | null> => {
    if (!auth) {
      return null;
    }
    const res = await pb.collection<Bookmark>("bookmarks").getList(1, 1, {
      filter: `animeId='${animeID}'`,
    });

    if (res.totalItems > 0) {
      if (res.items[0].status === status) {
        if (showToast) {
          toast.error("Already in this status", {
            style: { background: "red" },
          });
        }
        return res.items[0].id;
      }

      let updated = await pb.collection("bookmarks").update(res.items[0].id, {
        status: status,
      });

      if (showToast) {
        toast.success("Successfully updated status", {
          style: { background: "green" },
        });
      }

      return updated.id;
    } else {
      let created = await pb.collection<Bookmark>("bookmarks").create({
        user: auth.id,
        animeId: animeID,
        animeTitle: animeTitle,
        thumbnail: animeThumbnail,
        status: status,
      });

      if (showToast) {
        toast.success("Successfully added to list", {
          style: { background: "green" },
        });
      }

      return created.id;
    }
  };

  const syncWatchProgress = async (
    bookmarkId: string | null,
    watchedRecordId: string | null,
    episodeData: {
      episodeId: string;
      episodeNumber: number;
      current: number;
      duration: number;
    },
  ): Promise<string | null> => {
    if (!pb.authStore.isValid || !bookmarkId) return watchedRecordId;

    const dataToSave = {
      episodeId: episodeData.episodeId,
      episodeNumber: episodeData.episodeNumber,
      current: Math.round(episodeData.current), // Store as integer seconds
      timestamp: Math.round(episodeData.duration), // Use 'timestamp' field for duration
    };

    try {
      if (watchedRecordId) {
        await pb.collection("watched").update(watchedRecordId, dataToSave);
        return watchedRecordId;
      } else {
        const newWatchedRecord = await pb
          .collection("watched")
          .create(dataToSave);

        try {
          await pb.collection("bookmarks").update(bookmarkId, {
            "watchHistory+": newWatchedRecord.id,
          });
        } catch (relationError) {
          return null;
        }
        return newWatchedRecord.id;
      }
    } catch (error) {
      console.error("Error syncing watch progress:", error);
      return watchedRecordId;
    }
  };

  return { bookmarks, syncWatchProgress, createOrUpdateBookMark };
}

export default useBookMarks;
