import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * In Vercel Services mode, routing is handled at the edge by vercel.json rewrites.
   * For Docker/local dev, we keep standalone output.
   */
  output: process.env.VERCEL
    ? undefined
    : process.env.NODE_ENV === "production"
    ? "standalone"
    : undefined,
  serverExternalPackages: ["express", "cors", "bcryptjs", "@prisma/client", "prisma"],
  transpilePackages: ["@upchaar/api"],
};

export default nextConfig;
