import type { Request, Response } from "express";

/** Heartbeat comment keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 25_000;

export type SseStream = {
  send: (event: string, data: unknown) => void;
  comment: (text: string) => void;
  isClosed: () => boolean;
  close: () => void;
};

const openStreams = new Set<() => void>();

/**
 * Start an SSE response. Listeners registered by the caller are torn down via
 * `onClose`, which fires exactly once when the client disconnects.
 */
export function openSseStream(req: Request, res: Response, onClose: () => void): SseStream {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let closed = false;

  const heartbeat = setInterval(() => {
    if (!closed) res.write(`: heartbeat ${Date.now()}\n\n`);
  }, HEARTBEAT_MS);
  heartbeat.unref();

  const cleanup = (): void => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    openStreams.delete(cleanup);
    onClose();
    res.end();
  };

  openStreams.add(cleanup);
  req.on("close", cleanup);
  req.on("error", cleanup);
  res.on("close", cleanup);

  // Tell the browser to wait 3s before reconnecting after a drop.
  res.write("retry: 3000\n\n");

  return {
    send: (event, data) => {
      if (closed) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    comment: (text) => {
      if (closed) return;
      res.write(`: ${text}\n\n`);
    },
    isClosed: () => closed,
    close: cleanup,
  };
}

/** Used by the graceful-shutdown handler so `server.close()` can finish. */
export function closeAllSseStreams(): void {
  for (const cleanup of [...openStreams]) cleanup();
}
