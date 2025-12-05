import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //allow images from imagekit.io
  output: "standalone", // For containerized deployments
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Add image optimization
  images: {
    domains: ["https://www.johnsonsacademy.in", "ik.imagekit.io"],
  },
};

export default nextConfig;
