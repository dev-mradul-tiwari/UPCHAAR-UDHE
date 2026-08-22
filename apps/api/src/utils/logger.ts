import { env } from "../env.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogMeta = Record<string, unknown>;

const threshold = SEVERITY[env.LOG_LEVEL];

function serialiseMeta(meta: LogMeta): LogMeta {
  const out: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] =
      value instanceof Error
        ? {
            name: value.name,
            message: value.message,
            ...(env.isProduction ? {} : { stack: value.stack }),
          }
        : value;
  }
  return out;
}

function emit(level: LogLevel, message: string, meta?: LogMeta): void {
  if (SEVERITY[level] < threshold) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    service: "upchaar-api",
    message,
    ...(meta ? serialiseMeta(meta) : {}),
  };

  const line = env.isProduction
    ? JSON.stringify(record)
    : `${record.ts} ${level.toUpperCase().padEnd(5)} ${message}${
        meta ? ` ${JSON.stringify(serialiseMeta(meta))}` : ""
      }`;

  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => emit("debug", message, meta),
  info: (message: string, meta?: LogMeta) => emit("info", message, meta),
  warn: (message: string, meta?: LogMeta) => emit("warn", message, meta),
  error: (message: string, meta?: LogMeta) => emit("error", message, meta),
};
