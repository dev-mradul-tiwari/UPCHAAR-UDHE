import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Required by the Phase 3 Docker image. */
  output: process.env.VERCEL ? undefined : (process.env.NODE_ENV === "production" ? "standalone" : undefined),
};

export default nextConfig;
