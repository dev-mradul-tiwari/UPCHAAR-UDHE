import cors from "cors";
import express from "express";
import type { Express } from "express";
import helmet from "helmet";

import { env } from "./env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { apiRouter } from "./routes/index.js";
import { healthRouter } from "./routes/health.routes.js";

export const API_PREFIX = "/api/v1";

export function createApp(): Express {
  const app = express();

  // Behind the docker-compose network / any reverse proxy.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // API only — no HTML is served, and CSP breaks nothing here.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Prevent browser from caching HSTS on localhost and breaking HTTP requests
      hsts: false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Allow no origin (curl/server calls), explicit corsOrigins, wildcard *, or any *.vercel.app domain
        if (
          !origin ||
          env.corsOrigins.includes("*") ||
          env.corsOrigins.includes(origin) ||
          origin.endsWith(".vercel.app")
        ) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      exposedHeaders: ["X-Request-Id"],
    }),
  );

  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: env.JSON_BODY_LIMIT }));
  app.use(requestLogger);

  app.use(`${API_PREFIX}/health`, healthRouter);
  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
