import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/hospital-admin",
  reactStrictMode: true,
  /** `@upchaar/ui` ships raw .tsx — Next has to compile it. */
  transpilePackages: ["@upchaar/ui"],
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
  outputFileTracingIncludes: { "/**": ["../../packages/db/generated/client/**/*"] },
  serverExternalPackages: ["@prisma/client", "prisma"],
  output: process.env.VERCEL || process.platform === "win32" ? undefined : (process.env.NODE_ENV === "production" ? "standalone" : undefined),
};

export default nextConfig;
