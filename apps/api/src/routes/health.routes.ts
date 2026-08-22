import { Router } from "express";

import { prisma } from "../lib/db.js";
import { logger } from "../utils/logger.js";
import { envelope } from "../utils/respond.js";

export const healthRouter: Router = Router();

export type HealthPayload = {
  status: "ok" | "degraded";
  db: "up" | "down";
  uptime: number;
};

async function checkDatabase(): Promise<"up" | "down"> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "up";
  } catch (error) {
    logger.error("Database health check failed", { error });
    return "down";
  }
}

healthRouter.get("/", async (_req, res) => {
  const db = await checkDatabase();
  const payload: HealthPayload = {
    status: db === "up" ? "ok" : "degraded",
    db,
    uptime: Math.round(process.uptime()),
  };

  res
    .status(db === "up" ? 200 : 503)
    .json(envelope(db === "up", db === "up" ? "Healthy" : "Database unreachable", payload));
});
