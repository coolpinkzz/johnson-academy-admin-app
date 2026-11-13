import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //allow images from imagekit.io
  distDir: process.env.NODE_ENV === "development" ? ".next-build" : ".next",
  output: "standalone", // For containerized deployments
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  turbopack: {
    root: process.cwd(),
  },
  // Add image optimization
  images: {
    domains: ["https://www.johnsonsacademy.in", "ik.imagekit.io"],
  },
};

export default nextConfig;
