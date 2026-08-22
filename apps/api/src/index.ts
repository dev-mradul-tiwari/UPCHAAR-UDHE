import type { Server } from "node:http";

import { API_PREFIX, createApp } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./lib/db.js";
import { closeAllSseStreams } from "./lib/sse.js";
import { isAiEnabled } from "./lib/gemini.js";
import { logger } from "./utils/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server: Server = app.listen(env.PORT, () => {
  logger.info("Upchaar API listening", {
    port: env.PORT,
    env: env.NODE_ENV,
    prefix: API_PREFIX,
    aiEnabled: isAiEnabled(),
    corsOrigins: env.corsOrigins,
  });
  if (!isAiEnabled()) {
    logger.warn("GEMINI_API_KEY is not set — /ai routes will answer 503");
  }
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down", { signal });

  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  // Long-lived SSE responses would otherwise keep the server open forever.
  closeAllSseStreams();

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  try {
    await prisma.$disconnect();
  } catch (error) {
    logger.error("Failed to disconnect Prisma cleanly", { error });
  }

  clearTimeout(forceExit);
  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { error: reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception — shutting down", { error });
  void shutdown("uncaughtException");
});
