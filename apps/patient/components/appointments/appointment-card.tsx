"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, Stethoscope, Ticket } from "lucide-react";
import type { Appointment } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardFooter } from "@upchaar/ui/card";
import { StatusBadge } from "@upchaar/ui/status-badge";

import { formatDate, formatRelative, formatTime } from "@/lib/format";

export interface AppointmentCardProps {
  appointment: Appointment;
  /** Rendered in the footer — usually a cancel button. */
  action?: React.ReactNode;
}

export function AppointmentCard({ appointment, action }: AppointmentCardProps) {
  const doctor = appointment.doctor;

  return (
    <Card className="gap-4 py-5">
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CalendarClock aria-hidden className="size-4 text-muted-foreground" />
              {formatDate(appointment.scheduledFor)} · {formatTime(appointment.scheduledFor)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatRelative(appointment.scheduledFor)}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Building2 aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="sr-only">Hospital</dt>
              <dd className="font-medium text-foreground">
                {appointment.hospital?.name ?? "Hospital"}
              </dd>
              <dd className="text-muted-foreground">
                {appointment.department?.name ?? "Department"}
                {appointment.hospital ? ` · ${appointment.hospital.city}` : ""}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Stethoscope aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="sr-only">Doctor</dt>
              <dd className="font-medium text-foreground">
                {doctor?.name ?? "To be assigned"}
              </dd>
              <dd className="text-muted-foreground">
                {doctor?.specialization ?? "The hospital will assign a doctor"}
              </dd>
            </div>
          </div>
        </dl>

        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Reason: </span>
          {appointment.reason}
        </p>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Ticket aria-hidden className="size-3.5" />
          Token #{appointment.queueNumber}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {action}
          <Button asChild variant="outline" size="sm">
            <Link href={`/appointments/${appointment.id}`}>
              View queue
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
