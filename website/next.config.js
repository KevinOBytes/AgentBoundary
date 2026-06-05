const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
