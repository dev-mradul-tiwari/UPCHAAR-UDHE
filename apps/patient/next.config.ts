import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/patient",
  reactStrictMode: true,
  /** `@upchaar/ui` ships raw .tsx — Next has to compile it. */
  transpilePackages: ["@upchaar/ui"],
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
  outputFileTracingIncludes: { "/**": ["../../packages/db/generated/client/**/*"] },
  /** Required by the Phase 3 Docker image. */
  output: process.env.VERCEL ? undefined : (process.env.NODE_ENV === "production" ? "standalone" : undefined),
};

export default nextConfig;
