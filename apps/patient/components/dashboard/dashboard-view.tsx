"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarPlus,
  Droplet,
  MessageCircleHeart,
  Pill,
  ShieldAlert,
  Share2,
  CheckCircle2,
} from "lucide-react";
import type { Appointment } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { EmptyState } from "@upchaar/ui/empty-state";
import { PageHeader } from "@upchaar/ui/page-header";
import { Skeleton } from "@upchaar/ui/skeleton";
import { StatCard } from "@upchaar/ui/stat-card";

import { useLanguage } from "@upchaar/ui/language-provider";

import { AppointmentCard } from "@/components/appointments/appointment-card";
import { LiveQueueCard } from "@/components/queue/live-queue-card";
import { usePatient } from "@/components/session-provider";
import { api, errorMessage } from "@/lib/api";
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

function greetingFor(date: Date, lang: string): string {
  const hour = date.getHours();
  if (lang === "hi") {
    if (hour < 12) return "शुभ प्रभात";
    if (hour < 17) return "शुभ दोपहर";
    return "शुभ संध्या";
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { language, t } = useLanguage();
  const { data: patient } = usePatient();
  const appointments = useMyAppointments("ALL", 1, 20);
  const record = useMedicalRecord();
  const myReferralsQuery = useQuery({
    queryKey: ["my-referrals"],
    queryFn: () => api.referrals.myReferrals(),
  });

  const [greeting, setGreeting] = React.useState("Hello");
  React.useEffect(() => setGreeting(greetingFor(new Date(), language)), [language]);

  const items = appointments.data?.items ?? [];
  const next = React.useMemo(() => nextAppointment(items), [items]);
  const history = record.data?.medicalHistory ?? null;
  const firstName = patient?.name.split(" ")[0] ?? "";

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow={language === "hi" ? "आपकी देखभाल" : "Your care"}
        title={`${greeting}${firstName.length > 0 ? `, ${firstName}` : ""}`}
        description={language === "hi" ? "आज आपकी स्वास्थ्य देखभाल स्थिति।" : "Here is what is happening with your care today."}
        actions={
          <Button asChild>
            <Link href="/appointments/new">
              <CalendarPlus aria-hidden />
              {t("book_appointment")}
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

      {/* Referral Connection Notifications */}
      {myReferralsQuery.data && myReferralsQuery.data.length > 0 ? (
        <section className="space-y-4">
          {myReferralsQuery.data.map((referral) => {
            const isConnected = referral.status === "CONNECTED";
            return (
              <Card
                key={referral.id}
                className={`transition-all shadow-md ${
                  isConnected
                    ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-card to-card"
                    : "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                          isConnected ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                        }`}
                      >
                        <Share2 className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">
                          {isConnected ? "Specialist Connection Ready" : "Active Medical Referral"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Referred by <strong className="text-foreground">Dr. {referral.referringDoctorName}</strong> ({referral.referringHospitalName})
                        </CardDescription>
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
                        <CheckCircle2 className="size-3.5" />
                        Received & Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-500">
                        Pending Specialist Acceptance
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-card/80 p-3.5 border border-border/80 text-xs space-y-1.5">
                    <p className="font-semibold text-foreground">
                      {isConnected
                        ? `${referral.connectedDoctorName ? `Dr. ${referral.connectedDoctorName}` : "A specialist"} at ${referral.connectedHospitalName ?? "the hospital"} accepted your referral:`
                        : "Referral Reason & Clinical Details (Waiting for hospital/doctor connection):"}
                    </p>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      "{referral.reason}"
                    </p>
                    {referral.targetSpecialization ? (
                      <p className="text-2xs text-primary font-medium">
                        Requested Specialization: {referral.targetSpecialization}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-2xs text-muted-foreground">
                      Referred on: {new Date(referral.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {isConnected ? (
                      <Button asChild size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link
                          href={`/appointments/new?hospitalId=${referral.connectedHospitalId ?? ""}&doctorId=${referral.connectedDoctorId ?? ""}&reason=${encodeURIComponent(referral.reason)}`}
                        >
                          <CalendarPlus className="size-4" />
                          Book Appointment
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-amber-500/90 italic">
                        Booking will open when a doctor or hospital connects
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
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
