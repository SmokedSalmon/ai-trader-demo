import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Disable type-check here as it is just a demo project
  // enable build time type-check for serious projects.
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
