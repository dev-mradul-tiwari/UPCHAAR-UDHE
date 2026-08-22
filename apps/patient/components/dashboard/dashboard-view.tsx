"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  CalendarPlus,
  Droplet,
  MessageCircleHeart,
  Pill,
  ShieldAlert,
} from "lucide-react";
import type { Appointment } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { EmptyState } from "@upchaar/ui/empty-state";
import { PageHeader } from "@upchaar/ui/page-header";
import { Skeleton } from "@upchaar/ui/skeleton";
import { StatCard } from "@upchaar/ui/stat-card";

import { AppointmentCard } from "@/components/appointments/appointment-card";
import { LiveQueueCard } from "@/components/queue/live-queue-card";
import { usePatient } from "@/components/session-provider";
import { errorMessage } from "@/lib/api";
import { formatAge, formatGender } from "@/lib/format";
import { useMedicalRecord, useMyAppointments } from "@/lib/queries";

const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED", "IN_PROGRESS"]);

function nextAppointment(items: Appointment[]): Appointment | null {
  const now = Date.now();
  const upcoming = items
    .filter((item) => ACTIVE_STATUSES.has(item.status))
    .filter(
      (item) =>
        item.status === "IN_PROGRESS" ||
        new Date(item.scheduledFor).getTime() > now - 2 * 60 * 60 * 1000,
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
  return upcoming[0] ?? null;
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { data: patient } = usePatient();
  const appointments = useMyAppointments("ALL", 1, 20);
  const record = useMedicalRecord();

  // Set on the client so the server-rendered markup never disagrees.
  const [greeting, setGreeting] = React.useState("Hello");
  React.useEffect(() => setGreeting(greetingFor(new Date())), []);

  const items = appointments.data?.items ?? [];
  const next = React.useMemo(() => nextAppointment(items), [items]);
  const history = record.data?.medicalHistory ?? null;
  const firstName = patient?.name.split(" ")[0] ?? "";

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Your care"
        title={`${greeting}${firstName.length > 0 ? `, ${firstName}` : ""}`}
        description="Here is what is happening with your care today."
        actions={
          <Button asChild>
            <Link href="/appointments/new">
              <CalendarPlus aria-hidden />
              Book appointment
            </Link>
          </Button>
        }
      />

      {appointments.error !== null ? (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden />
          <AlertTitle>We could not load your appointments</AlertTitle>
          <AlertDescription>{errorMessage(appointments.error)}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4" aria-labelledby="next-visit-heading">
        <h2 id="next-visit-heading" className="text-lg font-semibold text-foreground">
          Your next visit
        </h2>

        {appointments.isPending ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : next === null ? (
          <EmptyState
            icon={<CalendarPlus />}
            title="No upcoming appointments"
            description="When you book a visit it will appear here, along with your live place in the queue."
            action={
              <Button asChild>
                <Link href="/appointments/new">Book an appointment</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <AppointmentCard appointment={next} />
            <LiveQueueCard appointmentId={next.id} />
          </div>
        )}
      </section>

      <section className="grid gap-4" aria-labelledby="health-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="health-heading" className="text-lg font-semibold text-foreground">
            Health summary
          </h2>
          <Link
            href="/records"
            className="rounded text-sm font-medium text-primary-subtle-foreground underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:outline-none"
          >
            Manage records
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Blood group"
            value={patient?.bloodGroup ?? "Not set"}
            icon={<Droplet aria-hidden />}
            tone="destructive"
            loading={record.isPending}
            hint={
              patient === undefined
                ? undefined
                : `${formatGender(patient.gender)} · ${formatAge(patient.dateOfBirth)} years`
            }
          />
          <StatCard
            label="Allergies"
            value={history?.allergies.length ?? 0}
            icon={<ShieldAlert aria-hidden />}
            tone="warning"
            loading={record.isPending}
            hint={
              history === null || history.allergies.length === 0
                ? "None recorded"
                : history.allergies.slice(0, 2).join(", ")
            }
          />
          <StatCard
            label="Ongoing conditions"
            value={history?.chronicDiseases.length ?? 0}
            icon={<Activity aria-hidden />}
            tone="info"
            loading={record.isPending}
            hint={
              history === null || history.chronicDiseases.length === 0
                ? "None recorded"
                : history.chronicDiseases.slice(0, 2).join(", ")
            }
          />
          <StatCard
            label="Current medications"
            value={history?.currentMedications.length ?? 0}
            icon={<Pill aria-hidden />}
            tone="primary"
            loading={record.isPending}
            hint={
              history === null || history.currentMedications.length === 0
                ? "None recorded"
                : history.currentMedications.slice(0, 2).join(", ")
            }
          />
        </div>

        {record.error !== null ? (
          <Alert variant="warning">
            <ShieldAlert aria-hidden />
            <AlertTitle>Health summary unavailable</AlertTitle>
            <AlertDescription>{errorMessage(record.error)}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <section aria-labelledby="support-heading" className="grid gap-4">
        <h2 id="support-heading" className="text-lg font-semibold text-foreground">
          Feeling unsure about something?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleHeart aria-hidden className="size-4.5 text-primary" />
                Talk to Dr. Positive
              </CardTitle>
              <CardDescription>
                A calm, plain-language companion for the questions you have before and
                after a procedure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/assistant">Start a conversation</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill aria-hidden className="size-4.5 text-primary" />
                Check your medicines
              </CardTitle>
              <CardDescription>
                See whether the medicines you take can safely be combined.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/medicines">Run an interaction check</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
