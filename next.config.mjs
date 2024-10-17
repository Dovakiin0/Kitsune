/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tradejapanstore.com",
      },
    ],
  },
};

export default nextConfig;

