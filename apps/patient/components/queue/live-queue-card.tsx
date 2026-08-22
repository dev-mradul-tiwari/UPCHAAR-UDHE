"use client";

import * as React from "react";
import { CheckCircle2, CircleSlash, Info, RefreshCw } from "lucide-react";
import type { AppointmentStatus } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@upchaar/ui/card";
import { QueuePosition } from "@upchaar/ui/queue-position";

import { LiveIndicator } from "@/components/queue/live-indicator";
import { useLiveQueue, useTicker } from "@/hooks/use-live-queue";
import { errorMessage } from "@/lib/api";
import { useQueueStatus } from "@/lib/queries";

/** Statuses that still have a place in the queue. */
const WAITING: readonly AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

function freshness(lastEventAt: number | null, now: number): string {
  if (lastEventAt === null) return "Waiting for the first update";
  const seconds = Math.max(0, Math.round((now - lastEventAt) / 1000));
  if (seconds < 5) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Updated ${minutes} min ago`;
}

export interface LiveQueueCardProps {
  appointmentId: string;
  /** `compact` drops the footer, for the dashboard. */
  variant?: "full" | "compact";
}

/**
 * The headline feature: a live queue position driven by SSE. The stream writes
 * into the query cache, so this component simply reads the cache and repaints.
 */
export function LiveQueueCard({ appointmentId, variant = "full" }: LiveQueueCardProps) {
  const { data: status, isPending, error } = useQueueStatus(appointmentId);
  const streamable = status === undefined || WAITING.includes(status.status);
  const { connection, lastEventAt } = useLiveQueue(appointmentId, streamable);
  const now = useTicker(connection === "live" && lastEventAt !== null, 1_000);

  const inQueue = status !== undefined && status.position !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live queue</CardTitle>
        <CardDescription>
          {status === undefined
            ? "Your place updates by itself — no need to refresh."
            : `${status.departmentName} · token #${status.queueNumber}`}
        </CardDescription>
        <CardAction>
          <LiveIndicator connection={streamable ? connection : "idle"} />
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        {error !== null ? (
          <Alert variant="destructive">
            <Info aria-hidden />
            <AlertTitle>We lost sight of the queue</AlertTitle>
            <AlertDescription>{errorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        {isPending ? (
          <QueuePosition position={null} loading variant="bare" />
        ) : status === undefined ? null : status.status === "PENDING" ? (
          <div className="grid gap-3">
            <Alert variant="warning">
              <Info aria-hidden />
              <AlertTitle>Waiting for hospital confirmation</AlertTitle>
              <AlertDescription>
                Your booking request for Token #{status.queueNumber} has been received. Live queue position and estimated wait time will appear as soon as the hospital or doctor confirms your appointment.
              </AlertDescription>
            </Alert>
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">Booking Status</dt>
                <dd className="font-semibold text-warning">Pending Confirmation</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">Your token</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  #{status.queueNumber}
                </dd>
              </div>
            </dl>
          </div>
        ) : inQueue ? (
          <QueuePosition
            variant="bare"
            position={status.position}
            peopleAhead={status.peopleAhead ?? undefined}
            estimatedWaitMinutes={status.estimatedWaitMinutes ?? undefined}
            label={
              status.status === "IN_PROGRESS"
                ? "You are with the doctor now"
                : "Your position in queue"
            }
          />
        ) : status.status === "COMPLETED" ? (
          <Alert variant="success">
            <CheckCircle2 aria-hidden />
            <AlertTitle>This visit is complete</AlertTitle>
            <AlertDescription>
              Take care. Your record is up to date under Health records.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="default">
            <CircleSlash aria-hidden />
            <AlertTitle>Not in the queue</AlertTitle>
            <AlertDescription>
              This appointment was cancelled, so it no longer holds a place.
            </AlertDescription>
          </Alert>
        )}

        {inQueue && status !== undefined ? (
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
            <div className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">Now serving</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {status.nowServing === null ? "Not started" : `#${status.nowServing}`}
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">Your token</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                #{status.queueNumber}
              </dd>
            </div>
          </dl>
        ) : null}
      </CardContent>

      {variant === "full" ? (
        <CardFooter className="justify-between border-t pt-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw aria-hidden className="size-3.5" />
            {streamable
              ? freshness(lastEventAt, now)
              : "This appointment is no longer in the queue"}
          </span>
          <span>Streamed over SSE</span>
        </CardFooter>
      ) : null}
    </Card>
  );
}
