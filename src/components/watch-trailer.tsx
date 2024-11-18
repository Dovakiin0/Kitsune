"use client";

import React, { useState } from "react";
import { CirclePlay } from "lucide-react";
import Button from "./common/custom-button";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

const WatchTrailer = ({ videoHref }: { videoHref: string }) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  if (!videoHref) return <></>;

  return (
    <>
      <Button
        className="absolute md:flex hidden md:bottom-10 md:right-10 bottom-4 right-4 m-auto z-10"
        LeftIcon={CirclePlay}
        onClick={() => setIsVideoOpen((prev) => !prev)}
      >
        Watch Trailer
      </Button>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-4xl aspect-video mx-4 md:mx-0"
            >
              <motion.button className="absolute -top-16 right-0 text-white text-xl bg-neutral-900/50 ring-1 backdrop-blur-md rounded-full p-2 dark:bg-neutral-100/50 dark:text-black">
                <XIcon className="size-5" />
              </motion.button>
              <div className="size-full border-2 border-white rounded-2xl overflow-hidden isolate z-[1] relative">
                <iframe
                  src={videoHref}
                  className="size-full rounded-2xl"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WatchTrailer;
