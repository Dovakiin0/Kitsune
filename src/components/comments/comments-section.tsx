"use client";

import React, { useState } from "react";
import { MessageSquare, AlertTriangle, Send, Eye, EyeOff, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useGetInfiniteComments, useAddComment } from "@/hooks/use-comments";
import Avatar from "@/components/common/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import LoginPopoverButton from "@/components/login-popover-button";

type Props = {
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
};

const CommentsSection = ({ animeId, animeTitle, episodeNumber }: Props) => {
  const { auth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(true);
  const [content, setContent] = useState("");
  const [spoil, setSpoil] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetInfiniteComments({
    animeId,
    episodeNumber,
    perPage: 10,
  });

  const addCommentMutation = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        content: content.trim(),
        animeId,
        animeTitle,
        episodeNumber,
        spoil,
      });
      setContent("");
      setSpoil(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const comments = data?.pages.flatMap((page) => page.comments) || [];
  const totalComments = data?.pages[0]?.totalItems || 0;

  return (
    <div className="flex flex-col gap-4 w-full py-6 bg-[#0f172a]/30 p-5 rounded-2xl border border-slate-800">
      {/* Collapsible Accordion Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none border-b border-slate-800/80 pb-3 group"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[#e9376b]" />
          <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-[#e9376b] transition">
            Episode Comments
          </h3>
          <span className="text-xs font-bold bg-[#e9376b]/20 text-[#e9376b] px-2.5 py-0.5 rounded-full border border-[#e9376b]/30">
            {totalComments}
          </span>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-gray-400 group-hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="flex flex-col gap-6 pt-2">
          {/* Post Comment Input Form */}
          {auth ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-sm">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about this episode..."
                rows={3}
                className="w-full bg-slate-900/90 text-white placeholder-gray-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#e9376b] border border-slate-800 transition resize-none"
              />

              <div className="flex items-center justify-between">
                <label htmlFor="spoil-checkbox" className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    id="spoil-checkbox"
                    type="checkbox"
                    checked={spoil}
                    onChange={(e) => setSpoil(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-[#e9376b] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#e9376b]"
                  />
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Contains Spoilers
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={addCommentMutation.isPending || !content.trim()}
                  className="bg-[#e9376b] hover:bg-[#e9376b]/90 text-white text-xs font-bold px-4 h-8 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#0f172a] rounded-xl border border-slate-800 text-sm">
              <p className="text-gray-400 text-xs sm:text-sm">Join the discussion! Log in to share comments with the community.</p>
              <LoginPopoverButton />
            </div>
          )}

          {/* Comment List */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="h-20 w-full animate-pulse bg-slate-800/80 rounded-xl"></div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="flex flex-col gap-4">
              {comments.map((comment) => {
                const isSpoiler = comment.spoil;
                const isRevealed = revealedSpoilers[comment.id];
                const user = comment.expand?.user;
                const createdDate = comment.created ? new Date(comment.created) : new Date();

                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 bg-[#0f172a]/60 p-4 rounded-xl border border-slate-800/80 hover:border-slate-800 transition"
                  >
                    <div className="shrink-0">
                      {user ? (
                        <Avatar
                          collectionID={user.collectionId}
                          id={user.id}
                          url={user.avatar}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xs text-gray-400 font-bold">
                          ?
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          {user?.username || "Anonymous"}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {formatDistanceToNow(createdDate, { addSuffix: true })}
                        </span>
                      </div>

                      {/* Comment Content or Spoiler Warning */}
                      {isSpoiler && !isRevealed ? (
                        <button
                          onClick={() => toggleSpoiler(comment.id)}
                          className="flex items-center gap-2 p-2.5 mt-1 bg-yellow-950/30 border border-yellow-800/40 text-yellow-300/90 rounded-lg text-xs hover:bg-yellow-900/40 transition w-fit"
                        >
                          <Eye className="h-3.5 w-3.5" /> Contains Spoilers — Click to View
                        </button>
                      ) : (
                        <div className="relative">
                          <p className="text-sm text-gray-300 leading-relaxed break-words mt-0.5">
                            {comment.content}
                          </p>
                          {isSpoiler && isRevealed && (
                            <button
                              onClick={() => toggleSpoiler(comment.id)}
                              className="text-[10px] text-yellow-500/80 hover:text-yellow-400 flex items-center gap-1 mt-1 font-semibold"
                            >
                              <EyeOff className="h-3 w-3" /> Hide Spoiler
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Pagination Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-gray-200 text-xs font-bold px-6 h-9 rounded-xl flex items-center gap-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#e9376b]" /> Loading...
                      </>
                    ) : (
                      "Load More Comments"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-[#0f172a]/40 rounded-xl border border-slate-800 text-center">
              <MessageSquare className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-gray-400">No comments yet for Episode {episodeNumber}.</p>
              <p className="text-xs text-gray-500 mt-1">Be the first to start the conversation!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
