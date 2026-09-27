import { existsSync } from "node:fs";
import path from "node:path";


import dotenv from "dotenv";
import { z } from "zod";

/**
 * Load .env files before validating. Nearest file wins (dotenv never
 * overwrites a variable that is already set), so a container-provided
 * environment always takes precedence over a checked-out repo .env.
 */
const moduleDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(moduleDir, "../.env"),
  path.resolve(moduleDir, "../../.env"),
  path.resolve(moduleDir, "../../../.env"),
  path.resolve(moduleDir, "../../../../.env"),
];
for (const file of candidates) {
  if (existsSync(file)) dotenv.config({ path: file });
}

/** Treat empty strings in .env files as "not set". */
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  JWT_EXPIRES_IN: z.string().trim().min(1).default("7d"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001,http://localhost:3002"),
  JSON_BODY_LIMIT: z.string().trim().min(1).default("1mb"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.6-flash"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  process.stderr.write(`Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  corsOrigins: raw.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
  isProduction: raw.NODE_ENV === "production",
  isDevelopment: raw.NODE_ENV === "development",
  aiEnabled: typeof raw.GEMINI_API_KEY === "string" && raw.GEMINI_API_KEY.length > 0,
} as const;

export type Env = typeof env;
