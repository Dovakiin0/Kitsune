import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/store/auth-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const GET_BOOKMARKS_KEY = "GET_BOOKMARKS";

type Props = {
  animeID?: string;
  status?: string;
  userId?: string;
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
  id: string;
  current: number;
  timestamp: number;
  episodeId?: string;
  episodeNumber: number;
  created: string;
};

function useBookMarks({
  animeID,
  status,
  userId,
  page = 1,
  per_page = 20,
  populate = true,
}: Props) {
  const { auth } = useAuthStore();
  const queryClient = useQueryClient();

  const targetUserId = userId || auth?.id;

  const filterParts = [];

  if (targetUserId) {
    filterParts.push(`user='${targetUserId}'`);
  }

  if (animeID) {
    filterParts.push(`animeId='${animeID}'`);
  }

  if (status) {
    filterParts.push(`status='${status}'`);
  }

  const filters = filterParts.join(" && ");

  const { data, isLoading } = useQuery({
    queryKey: [GET_BOOKMARKS_KEY, { animeID, status, page, per_page, userId: targetUserId }],
    queryFn: async () => {
      const res = await pb
        .collection<Bookmark>("bookmarks")
        .getList(page, per_page, {
          filter: filters,
          expand: "watchHistory",
          sort: "-updated",
          requestKey: null,
        });

      return {
        bookmarks: res.items.length > 0 ? res.items : null,
        totalPages: res.totalPages,
      };
    },
    enabled: populate && !!auth,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetching when switching tabs
  });

  const bookmarks = data?.bookmarks ?? null;
  const totalPages = data?.totalPages ?? 0;

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
    try {
      const res = await pb.collection<Bookmark>("bookmarks").getList(1, 1, {
        filter: `animeId='${animeID}'`,
        requestKey: null,
      });

      let bookmarkId: string;

      if (res.totalItems > 0) {
        if (res.items[0].status === status) {
          if (showToast) {
            toast.error("Already in this status", {
              style: { background: "red" },
            });
          }
          return res.items[0].id;
        }

        const updated = await pb
          .collection("bookmarks")
          .update(res.items[0].id, {
            status: status,
          });

        if (showToast) {
          toast.success("Successfully updated status", {
            style: { background: "green" },
          });
        }

        bookmarkId = updated.id;
      } else {
        const created = await pb.collection<Bookmark>("bookmarks").create({
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

        bookmarkId = created.id;
      }

      // Invalidate bookmark queries so React Query updates smoothly
      queryClient.invalidateQueries({ queryKey: [GET_BOOKMARKS_KEY] });
      return bookmarkId;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const syncWatchProgress = async (
    bookmarkId: string | null,
    watchedRecordId: string | null,
    episodeData: {
      episodeId?: string;
      episodeNumber: number;
      current: number;
      duration: number;
    },
  ): Promise<string | null> => {
    if (!pb.authStore.isValid || !bookmarkId) return watchedRecordId;

    const dataToSave: Record<string, any> = {
      episodeNumber: episodeData.episodeNumber,
      current: Math.round(episodeData.current),
      timestamp: Math.round(episodeData.duration),
    };

    if (episodeData.episodeId) {
      dataToSave.episodeId = episodeData.episodeId;
    }

    try {
      let targetRecordId: string | null = watchedRecordId;

      // Deduplication: If no in-memory record ID, check if a watched record for this episode already exists in PocketBase
      if (!targetRecordId) {
        try {
          const bookmarkRecord = await pb.collection<Bookmark>("bookmarks").getOne(bookmarkId, {
            expand: "watchHistory",
            requestKey: null,
          });
          const existingHistory = bookmarkRecord.expand?.watchHistory || [];
          const existingEpRecord = existingHistory.find(
            (w) => w.episodeNumber === episodeData.episodeNumber
          );
          if (existingEpRecord) {
            targetRecordId = existingEpRecord.id;
          }
        } catch (e) {
          console.warn("Could not check existing watch history:", e);
        }
      }

      if (targetRecordId) {
        await pb.collection("watched").update(targetRecordId, dataToSave);
        queryClient.invalidateQueries({ queryKey: [GET_BOOKMARKS_KEY] });
        return targetRecordId;
      } else {
        const newWatchedRecord = await pb
          .collection("watched")
          .create(dataToSave);

        try {
          await pb.collection("bookmarks").update(bookmarkId, {
            "watchHistory+": newWatchedRecord.id,
          });
          queryClient.invalidateQueries({ queryKey: [GET_BOOKMARKS_KEY] });
          return newWatchedRecord.id;
        } catch (error) {
          console.error(
            "Error updating bookmark with new watch record:",
            error,
          );
          return null;
        }
      }
    } catch (error) {
      console.error("Error syncing watch progress:", error);
      return watchedRecordId;
    }
  };

  return {
    bookmarks,
    syncWatchProgress,
    createOrUpdateBookMark,
    totalPages,
    isLoading,
  };
}

export default useBookMarks;
