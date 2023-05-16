"use client";
import { TNewsFeed } from "@/@types/NewsType";
import React from "react";
import { motion } from "framer-motion";

function NewsCard({ news }: { news: TNewsFeed }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className="flex gap-3 xl:gap-5 items-center flex-col h-[300px] xl:h-[400px]"
    >
      <img
        src={news.thumbnail}
        alt={news.title}
        className="object-cover w-full h-[150px] rounded-lg"
      />
      <div className="flex flex-col space-y-3">
        <h2 className="card-title">{news.title}</h2>
        <p>
          {news.preview.intro.length > 120
            ? news.preview.intro.slice(0, 120) + "..."
            : news.preview.intro}
          .{" "}
          <a
            className="text-blue-300 cursor-pointer"
            href={news.url}
            target="_blank"
          >
            See More (Source: ANN)
          </a>
        </p>
        <p className="text-sm">{news.uploadedAt}</p>
      </div>
    </motion.div>
  );
}

export default NewsCard;
