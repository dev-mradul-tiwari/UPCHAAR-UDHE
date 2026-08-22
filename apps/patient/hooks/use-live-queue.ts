"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Appointment, QueueStatus } from "@upchaar/types";

import { streamUrl } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { useSessionToken } from "@/components/session-provider";

export type LiveConnection = "idle" | "connecting" | "live" | "reconnecting";

export type LiveQueueConnection = {
  connection: LiveConnection;
  /** Epoch ms of the last event received, or `null` if none yet. */
  lastEventAt: number | null;
  /** How many times the stream has had to reconnect. */
  reconnects: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQueueStatus(value: unknown): value is QueueStatus {
  return (
    isRecord(value) &&
    typeof value["appointmentId"] === "string" &&
    typeof value["queueNumber"] === "number" &&
    typeof value["departmentId"] === "string"
  );
}

function isAppointment(value: unknown): value is Appointment {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["status"] === "string" &&
    typeof value["scheduledFor"] === "string"
  );
}

function payloadOf(event: Event): unknown {
  const message = event as MessageEvent<unknown>;
  if (typeof message.data !== "string") return null;
  try {
    return JSON.parse(message.data) as unknown;
  } catch {
    return null;
  }
}

const MAX_BACKOFF_MS = 20_000;

/**
 * Subscribes to `GET /stream/appointment/:id` and pushes every `queue.updated`
 * / `appointment.updated` payload straight into the React Query cache, so any
 * component reading those keys repaints the moment the queue moves.
 *
 * `EventSource` retries by itself while the connection is merely dropped; when
 * the browser gives up (`readyState === CLOSED`, e.g. after a 5xx) this
 * reconnects with a capped exponential backoff.
 */
export function useLiveQueue(
  appointmentId: string,
  enabled = true,
): LiveQueueConnection {
  const token = useSessionToken();
  const queryClient = useQueryClient();

  const [connection, setConnection] = React.useState<LiveConnection>("idle");
  const [lastEventAt, setLastEventAt] = React.useState<number | null>(null);
  const [reconnects, setReconnects] = React.useState(0);

  React.useEffect(() => {
    if (!enabled || token === null || appointmentId.length === 0) {
      setConnection("idle");
      return;
    }

    let cancelled = false;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const handleQueue = (event: Event) => {
      const payload = payloadOf(event);
      if (!isQueueStatus(payload)) return;
      queryClient.setQueryData(queryKeys.queue(appointmentId), payload);
      setLastEventAt(Date.now());
      setConnection("live");
    };

    const handleAppointment = (event: Event) => {
      const payload = payloadOf(event);
      if (!isAppointment(payload)) return;
      queryClient.setQueryData(queryKeys.appointment(appointmentId), payload);
      void queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
      setLastEventAt(Date.now());
      setConnection("live");
    };

    const connect = () => {
      if (cancelled) return;
      setConnection(attempt === 0 ? "connecting" : "reconnecting");

      const stream = new EventSource(
        streamUrl(`/stream/appointment/${appointmentId}`, token),
      );
      source = stream;

      stream.onopen = () => {
        if (cancelled) return;
        attempt = 0;
        setConnection("live");
      };

      stream.addEventListener("queue.updated", handleQueue);
      stream.addEventListener("appointment.updated", handleAppointment);

      stream.onerror = () => {
        if (cancelled) return;
        setConnection("reconnecting");
        if (stream.readyState !== EventSource.CLOSED) return;

        // The browser has stopped retrying — take over with a backoff.
        stream.close();
        attempt += 1;
        setReconnects((count) => count + 1);
        const delay = Math.min(MAX_BACKOFF_MS, 1_000 * 2 ** (attempt - 1));
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      if (source !== null) {
        source.removeEventListener("queue.updated", handleQueue);
        source.removeEventListener("appointment.updated", handleAppointment);
        source.close();
      }
    };
  }, [appointmentId, enabled, queryClient, token]);

  return { connection, lastEventAt, reconnects };
}

/** Re-renders every second so "updated 12s ago" actually ticks. */
export function useTicker(active: boolean, intervalMs = 1_000): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return now;
}
