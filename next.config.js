const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
});
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {},
};

module.exports = withPWA(nextConfig);
