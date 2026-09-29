import type { NextConfig } from "next";
import path from "path";

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
  serverExternalPackages: ["express", "cors", "bcryptjs", "@prisma/client", "prisma", "@upchaar/db"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/**": [
      // The Next.js catchAll handler imports this; must be in the bundle or the function fails to load
      "../../api/dist/**/*",
      // @upchaar/db re-exports PrismaClient from ../generated/client and its own dist/index.js
      "../../packages/db/dist/**/*",
      "../../packages/db/generated/client/**/*",
      // Shared types runtime used by the API handlers
      "../../packages/types/dist/**/*",
    ],
  },
};

export default nextConfig;
