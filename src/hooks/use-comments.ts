import { pb } from "@/lib/pocketbase";
import { IComment } from "@/types/comment";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

export const GET_COMMENTS_KEY = "GET_COMMENTS";
export const GET_RECENT_COMMENTS_KEY = "GET_RECENT_COMMENTS";

type GetCommentsParams = {
  animeId: string;
  episodeNumber?: number;
  page?: number;
  perPage?: number;
};

export const useGetComments = ({
  animeId,
  episodeNumber,
  page = 1,
  perPage = 30,
}: GetCommentsParams) => {
  return useQuery({
    queryKey: [GET_COMMENTS_KEY, { animeId, episodeNumber, page, perPage }],
    queryFn: async () => {
      const filters = [];
      if (animeId) filters.push(`animeId = "${animeId}"`);
      if (episodeNumber !== undefined && episodeNumber !== null) {
        filters.push(`episodeNumber = ${episodeNumber}`);
      }

      const res = await pb
        .collection<IComment>("comments")
        .getList(page, perPage, {
          filter: filters.join(" && "),
          expand: "user",
          sort: "-created",
          requestKey: null,
        });

      return {
        comments: res.items,
        totalItems: res.totalItems,
        totalPages: res.totalPages,
      };
    },
    enabled: !!animeId,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    refetchOnWindowFocus: false,
  });
};

export const useGetInfiniteComments = ({
  animeId,
  episodeNumber,
  perPage = 10,
}: {
  animeId: string;
  episodeNumber?: number;
  perPage?: number;
}) => {
  return useInfiniteQuery({
    queryKey: [GET_COMMENTS_KEY, { animeId, episodeNumber, perPage }],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = Number(pageParam) || 1;
      const filters = [];
      if (animeId) filters.push(`animeId = "${animeId}"`);
      if (episodeNumber !== undefined && episodeNumber !== null && episodeNumber > 0) {
        filters.push(`episodeNumber = ${episodeNumber}`);
      }

      const filterString = filters.join(" && ");

      try {
        const res = await pb
          .collection<IComment>("comments")
          .getList(pageNum, perPage, {
            filter: filterString,
            expand: "user",
            sort: "-created",
            requestKey: null,
          });

        return {
          comments: res.items,
          totalItems: res.totalItems,
          totalPages: res.totalPages,
          page: pageNum,
        };
      } catch (err) {
        console.warn("Retrying comments query without expand:", err);
        try {
          const res = await pb
            .collection<IComment>("comments")
            .getList(pageNum, perPage, {
              filter: filterString,
              sort: "-created",
              requestKey: null,
            });

          return {
            comments: res.items,
            totalItems: res.totalItems,
            totalPages: res.totalPages,
            page: pageNum,
          };
        } catch (innerErr) {
          console.error("Failed to fetch comments:", innerErr);
          return {
            comments: [],
            totalItems: 0,
            totalPages: 1,
            page: pageNum,
          };
        }
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!animeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useGetRecentComments = (limit: number = 10) => {
  return useQuery({
    queryKey: [GET_RECENT_COMMENTS_KEY, limit],
    queryFn: async () => {
      try {
        const res = await pb
          .collection<IComment>("comments")
          .getList(1, limit, {
            expand: "user",
            sort: "-created",
            requestKey: null,
          });

        return res.items;
      } catch (err) {
        console.error("Failed to fetch recent comments:", err);
        return [];
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export type AddCommentInput = {
  content: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  spoil: boolean;
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { auth } = useAuthStore();

  return useMutation({
    mutationFn: async (input: AddCommentInput) => {
      if (!auth) {
        throw new Error("You must be logged in to comment.");
      }

      const newRecord = await pb.collection("comments").create({
        content: input.content,
        user: auth.id,
        animeId: input.animeId,
        animeTitle: input.animeTitle,
        episodeNumber: input.episodeNumber,
        spoil: input.spoil,
      });

      return newRecord;
    },
    onSuccess: () => {
      toast.success("Comment posted successfully!", {
        style: { background: "green" },
      });
      queryClient.invalidateQueries({ queryKey: [GET_COMMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_RECENT_COMMENTS_KEY] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to post comment", {
        style: { background: "red" },
      });
    },
  });
};
