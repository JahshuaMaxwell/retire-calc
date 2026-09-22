import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server treats 127.0.0.1 as a different origin from localhost and
  // will serve the page without the scripts that make it interactive.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
