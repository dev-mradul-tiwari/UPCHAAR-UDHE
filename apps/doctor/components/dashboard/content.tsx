"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { Appointment } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@upchaar/ui/table";
import { PageHeader } from "@upchaar/ui/page-header";
import { StatCard } from "@upchaar/ui/stat-card";
import { Skeleton } from "@upchaar/ui/skeleton";
import { EmptyState } from "@upchaar/ui/empty-state";
import { Switch } from "@upchaar/ui/switch";
import { toast } from "@upchaar/ui/sonner";

import { useQueryClient } from "@tanstack/react-query";
import type { Doctor } from "@upchaar/types";

import { api, isApiError } from "@/lib/api";
import { useDoctorStats, useAppointments } from "@/lib/queries";
import { doctorQueryKey, useDoctor } from "@/components/session-provider";
import { StatusBadge } from "./status-badge";

const today = new Date().toISOString().split("T")[0];

function formatTimeSlot(isoDateStr: string): string {
  const d = new Date(isoDateStr);
  const startHour = d.getHours();
  const endHour = (startHour + 1) % 24;

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };

  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}

export function DashboardContent() {
  const queryClient = useQueryClient();
  const { data: doctor, isLoading: doctorLoading } = useDoctor();
  const { data: stats, isLoading: statsLoading } = useDoctorStats();
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    { date: today },
  );
  const [availabilityChanging, setAvailabilityChanging] = React.useState(false);
  const [filterCurrentSlot, setFilterCurrentSlot] = React.useState(false);

  async function handleAvailabilityChange(isAvailable: boolean) {
    setAvailabilityChanging(true);
    try {
      await api.doctors.setAvailability(isAvailable);
      queryClient.setQueryData(doctorQueryKey, (old: Doctor | undefined) =>
        old ? { ...old, isAvailable } : old,
      );
      await queryClient.invalidateQueries({ queryKey: doctorQueryKey });
      toast.success(
        isAvailable ? "You are now on duty" : "You are now off duty",
      );
    } catch (error) {
      toast.error(
        isApiError(error) ? error.message : "Failed to update availability",
      );
    } finally {
      setAvailabilityChanging(false);
    }
  }

  const appointments = appointmentsData?.items ?? [];

  const now = new Date();
  const currentHour = now.getHours();

  const displayedAppointments = React.useMemo(() => {
    if (!filterCurrentSlot) return appointments;
    return appointments.filter((appointment) => {
      const aptDate = new Date(appointment.scheduledFor);
      return aptDate.getHours() === currentHour;
    });
  }, [appointments, filterCurrentSlot, currentHour]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your day at a glance"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">On duty:</span>
              {doctorLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Switch
                  checked={doctor?.isAvailable ?? false}
                  onCheckedChange={handleAvailabilityChange}
                  disabled={availabilityChanging}
                  aria-label="Toggle duty status"
                />
              )}
            </div>
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4 sm:p-6"
            >
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Doctor Rating"
              value={`★ ${(doctor?.rating ?? 4.0).toFixed(1)}`}
              unit="out of 5.0 stars"
            />
            <StatCard
              label="Today Total"
              value={stats?.todayTotal ?? 0}
              unit="appointments scheduled"
            />
            <StatCard
              label="Seen Today"
              value={stats?.seenToday ?? 0}
              unit="completed"
            />
            <StatCard
              label="Waiting"
              value={stats?.waitingToday ?? 0}
              unit="in queue"
            />
            <StatCard
              label="Avg Duration"
              value={`${stats?.avgConsultMinutes ?? 15}m`}
              unit="per consultation"
            />
          </>
        )}
      </div>

      {/* Today's appointments */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Today's Appointments
            </h2>
            <p className="text-sm text-muted-foreground">
              {displayedAppointments.length} appointment{displayedAppointments.length !== 1 ? "s" : ""}{" "}
              {filterCurrentSlot ? "in current slot" : "scheduled"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filterCurrentSlot ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCurrentSlot((prev) => !prev)}
            >
              <Clock aria-hidden className="h-4 w-4 mr-1.5" />
              {filterCurrentSlot ? "Current Time Slot (Active)" : "Current Time Slot"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/appointments">
                View all
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        {appointmentsLoading ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : displayedAppointments.length === 0 ? (
          <EmptyState
            title={filterCurrentSlot ? "No appointments in current time slot" : "No appointments"}
            description={
              filterCurrentSlot
                ? "There are no appointments scheduled for the current time slot"
                : "You have no appointments scheduled for today"
            }
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAppointments.map((appointment: Appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.patient?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatTimeSlot(appointment.scheduledFor)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {appointment.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={appointment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
