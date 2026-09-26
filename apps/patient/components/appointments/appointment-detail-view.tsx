"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarClock,
  CalendarX2,
  MessageSquareText,
  Stethoscope,
} from "lucide-react";
import type { AppointmentStatus } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@upchaar/ui/dialog";
import { EmptyState } from "@upchaar/ui/empty-state";
import { PageHeader } from "@upchaar/ui/page-header";
import { Separator } from "@upchaar/ui/separator";
import { Skeleton } from "@upchaar/ui/skeleton";
import { StatusBadge } from "@upchaar/ui/status-badge";
import { toast } from "@upchaar/ui/sonner";

import { LiveQueueCard } from "@/components/queue/live-queue-card";
import { api, errorMessage, isApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatRelative, formatTime } from "@/lib/format";
import { VideoConsultationSection } from "./video-consultation-section";
import { useAppointment } from "@/lib/queries";

const CANCELLABLE: readonly AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export function AppointmentDetailView({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient();
  const { data: appointment, isPending, error } = useAppointment(appointmentId);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const cancel = useMutation({
    mutationFn: () => api.appointments.cancel(appointmentId),
    onSuccess: async () => {
      setConfirmOpen(false);
      toast.success("Appointment cancelled", {
        description: "Your place in the queue has been released.",
      });
      await queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
      await queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
      await queryClient.invalidateQueries({ queryKey: ["queue", appointmentId] });
    },
    onError: (failure: unknown) => {
      toast.error("We could not cancel that", { description: errorMessage(failure) });
    },
  });

  if (isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error !== null || appointment === undefined) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <div className="grid gap-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/appointments">
            <ArrowLeft aria-hidden />
            Back to appointments
          </Link>
        </Button>
        <EmptyState
          icon={<CalendarX2 />}
          title={notFound ? "That appointment is not here" : "Something went wrong"}
          description={
            notFound
              ? "It may have been cancelled, or the link is out of date."
              : errorMessage(error)
          }
          action={
            <Button asChild>
              <Link href="/appointments">Back to appointments</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const timeline: ReadonlyArray<{ label: string; value: string | null }> = [
    { label: "Booked", value: appointment.createdAt },
    { label: "Consultation started", value: appointment.startedAt },
    { label: "Completed", value: appointment.completedAt },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/appointments">
            <ArrowLeft aria-hidden />
            Back to appointments
          </Link>
        </Button>

        <PageHeader
          eyebrow={appointment.hospital?.name ?? "Appointment"}
          title={`${appointment.department?.name ?? "Consultation"} · ${formatDate(
            appointment.scheduledFor,
          )}`}
          description={`${formatTime(appointment.scheduledFor)} · ${formatRelative(
            appointment.scheduledFor,
          )}`}
          actions={
            CANCELLABLE.includes(appointment.status) ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(true)}
              >
                <Ban aria-hidden />
                Cancel appointment
              </Button>
            ) : null
          }
        >
          <div className="pt-1">
            <StatusBadge status={appointment.status} />
          </div>
        </PageHeader>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <LiveQueueCard appointmentId={appointmentId} />

        <Card>
          <CardHeader>
            <CardTitle>Visit details</CardTitle>
            <CardDescription>Everything the hospital has on this booking.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-4">
              <div className="flex items-start gap-3">
                <Building2 aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="grid gap-0.5">
                  <dt className="text-xs text-muted-foreground">Hospital</dt>
                  <dd className="font-medium text-foreground">
                    {appointment.hospital?.name ?? "Hospital"}
                  </dd>
                  <dd className="text-sm text-muted-foreground">
                    {appointment.hospital?.city ?? ""}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Stethoscope aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="grid gap-0.5">
                  <dt className="text-xs text-muted-foreground">Doctor</dt>
                  <dd className="font-medium text-foreground">
                    {appointment.doctor?.name ?? "To be assigned"}
                  </dd>
                  <dd className="text-sm text-muted-foreground">
                    {appointment.doctor?.specialization ??
                      "The hospital will assign a doctor before your turn."}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="grid gap-0.5">
                  <dt className="text-xs text-muted-foreground">Scheduled for</dt>
                  <dd className="font-medium text-foreground">
                    {formatDateTime(appointment.scheduledFor)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquareText aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="grid gap-0.5">
                  <dt className="text-xs text-muted-foreground">Reason</dt>
                  <dd className="text-foreground">{appointment.reason}</dd>
                </div>
              </div>

              {appointment.notes !== null ? (
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Notes from the hospital</dt>
                  <dd className="text-sm text-foreground">{appointment.notes}</dd>
                </div>
              ) : null}
            </dl>

            <Separator />

            <ol className="grid gap-3">
              {timeline.map((entry) => (
                <li key={entry.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      aria-hidden
                      className={
                        entry.value === null
                          ? "size-2 rounded-full bg-border"
                          : "size-2 rounded-full bg-primary"
                      }
                    />
                    {entry.label}
                  </span>
                  <span className="text-sm text-foreground">
                    {entry.value === null ? (
                      <span className="text-muted-foreground">Not yet</span>
                    ) : (
                      formatDateTime(entry.value)
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {appointment.type === "VIDEO" && ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(appointment.status) && (
        <VideoConsultationSection appointmentId={appointmentId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>While you wait</CardTitle>
          <CardDescription>
            Small things that make the visit smoother for you and your doctor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              Keep this page open — your position updates by itself, no refreshing needed.
            </li>
            <li>
              Arrive about 10 minutes before your estimated turn so you do not lose the
              slot.
            </li>
            <li>
              Check that your{" "}
              <Link
                href="/records"
                className="rounded font-medium text-primary-subtle-foreground underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:outline-none"
              >
                health records
              </Link>{" "}
              list your current medicines and allergies.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>
              Token #{appointment.queueNumber} will be released and everyone behind you
              moves up. You can always book again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep it
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              loading={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
