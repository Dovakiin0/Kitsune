import React, { useCallback } from "react";
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

  const targetUserId = userId || auth?.id || pb.authStore.record?.id;

  const filterParts = [];

  if (targetUserId) {
    filterParts.push(`user='${targetUserId}'`);
  }

  if (animeID) {
    filterParts.push(`animeId='${animeID}'`);
  }

  if (status) {
    const altStatus = status.includes("_")
      ? status.replace(/_/g, " ")
      : status.replace(/\s+/g, "_");
    if (altStatus !== status) {
      filterParts.push(`(status='${status}' || status='${altStatus}')`);
    } else {
      filterParts.push(`status='${status}'`);
    }
  }

  const filters = filterParts.join(" && ");

  const { data, isLoading } = useQuery({
    queryKey: [
      GET_BOOKMARKS_KEY,
      { animeID, status, page, per_page, userId: targetUserId },
    ],
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
    enabled: populate && !!targetUserId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const bookmarks = data?.bookmarks ?? null;
  const totalPages = data?.totalPages ?? 0;

  const createOrUpdateBookMark = useCallback(
    async (
      targetAnimeID: string,
      animeTitle: string,
      animeThumbnail: string,
      targetStatus: string,
      showToast: boolean = true,
    ): Promise<string | null> => {
      const currentUserId = auth?.id || pb.authStore.record?.id;
      if (!currentUserId || !targetAnimeID) {
        return null;
      }
      try {
        const res = await pb.collection<Bookmark>("bookmarks").getList(1, 1, {
          filter: `user='${currentUserId}' && animeId='${targetAnimeID}'`,
          requestKey: null,
        });

        let bookmarkId: string;

        if (res.totalItems > 0) {
          if (res.items[0].status === targetStatus) {
            if (showToast) {
              toast.error("Already in this status", {
                style: { background: "red" },
              });
            }
            return res.items[0].id;
          }

          const updated = await pb
            .collection("bookmarks")
            .update(
              res.items[0].id,
              {
                status: targetStatus,
                ...(animeTitle ? { animeTitle } : {}),
                ...(animeThumbnail ? { thumbnail: animeThumbnail } : {}),
              },
              { requestKey: null },
            );

          if (showToast) {
            toast.success("Successfully updated status", {
              style: { background: "green" },
            });
          }

          bookmarkId = updated.id;
        } else {
          const created = await pb.collection<Bookmark>("bookmarks").create(
            {
              user: currentUserId,
              animeId: targetAnimeID,
              animeTitle: animeTitle,
              thumbnail: animeThumbnail,
              status: targetStatus,
            },
            { requestKey: null },
          );

          if (showToast) {
            toast.success("Successfully added to list", {
              style: { background: "green" },
            });
          }

          bookmarkId = created.id;
        }

        queryClient.invalidateQueries({ queryKey: [GET_BOOKMARKS_KEY] });
        return bookmarkId;
      } catch (error) {
        console.error("Error creating/updating bookmark:", error);
        return null;
      }
    },
    [auth?.id, queryClient],
  );

  const syncWatchProgress = useCallback(
    async (
      bookmarkId: string | null,
      watchedRecordId: string | null,
      episodeData: {
        episodeId?: string;
        episodeNumber: number;
        current: number;
        duration: number;
      },
    ): Promise<string | null> => {
      const isAuthenticated = pb.authStore.isValid || Boolean(auth?.id);
      if (!isAuthenticated || !bookmarkId) return watchedRecordId;

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

        if (!targetRecordId) {
          try {
            const bookmarkRecord = await pb
              .collection<Bookmark>("bookmarks")
              .getOne(bookmarkId, {
                expand: "watchHistory",
                requestKey: null,
              });
            const existingHistory = bookmarkRecord.expand?.watchHistory || [];
            const existingEpRecord = existingHistory.find(
              (w) => Number(w.episodeNumber) === Number(episodeData.episodeNumber),
            );
            if (existingEpRecord) {
              targetRecordId = existingEpRecord.id;
            }
          } catch (e) {
            console.warn("Could not check existing watch history:", e);
          }
        }

        if (targetRecordId) {
          await pb
            .collection("watched")
            .update(targetRecordId, dataToSave, { requestKey: null });
          queryClient.invalidateQueries({ queryKey: [GET_BOOKMARKS_KEY] });
          return targetRecordId;
        } else {
          const newWatchedRecord = await pb
            .collection("watched")
            .create(dataToSave, { requestKey: null });

          try {
            await pb.collection("bookmarks").update(
              bookmarkId,
              {
                "watchHistory+": newWatchedRecord.id,
              },
              { requestKey: null },
            );
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
    },
    [auth?.id, queryClient],
  );

  return {
    bookmarks,
    syncWatchProgress,
    createOrUpdateBookMark,
    totalPages,
    isLoading,
  };
}

export default useBookMarks;
