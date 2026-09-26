import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** `@upchaar/ui` ships raw .tsx — Next has to compile it. */
  transpilePackages: ["@upchaar/ui"],
  /** Required by the Phase 3 Docker image. */
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
};

export default nextConfig;
