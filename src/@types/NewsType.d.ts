export type TNewsFeed = {
  title: string;
  id: string;
  uploadedAt: string;
  topics: string[];
  preview: {
    intro: string;
    full: string;
  };
  thumbnail: string;
  url: string;
};
