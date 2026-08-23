"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@upchaar/types";
import { ALLOWED_STATUS_TRANSITIONS } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@upchaar/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@upchaar/ui/tabs";
import { PageHeader } from "@upchaar/ui/page-header";
import { EmptyState } from "@upchaar/ui/empty-state";
import { Skeleton } from "@upchaar/ui/skeleton";
import { toast } from "@upchaar/ui/sonner";

import { useQueryClient } from "@tanstack/react-query";

import { api, isApiError } from "@/lib/api";
import { useAppointments } from "@/lib/queries";
import { StatusBadge } from "@/components/dashboard/status-badge";

type TabValue = AppointmentStatus | "ALL";

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

export function AppointmentsContent() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<TabValue>("ALL");
  const [date, setDate] = React.useState<string | undefined>(undefined);
  const [filterCurrentSlot, setFilterCurrentSlot] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [changingAppointmentId, setChangingAppointmentId] = React.useState<string | null>(null);

  const { data: appointmentsData, isLoading } = useAppointments(
    {
      status: status === "ALL" ? undefined : status,
      date,
    },
    page,
  );

  const rawAppointments = appointmentsData?.items ?? [];
  const total = appointmentsData?.total ?? 0;

  const now = new Date();
  const currentHour = now.getHours();

  const appointments = React.useMemo(() => {
    const filtered = filterCurrentSlot
      ? rawAppointments.filter((appointment) => {
          const aptDate = new Date(appointment.scheduledFor);
          return aptDate.getHours() === currentHour;
        })
      : rawAppointments;

    return [...filtered].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
  }, [rawAppointments, filterCurrentSlot, currentHour]);

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    if (!isTransitionAllowed(appointments.find((a) => a.id === appointmentId)?.status as AppointmentStatus, newStatus)) {
      toast.error("This status transition is not allowed");
      return;
    }

    setChangingAppointmentId(appointmentId);
    try {
      await api.appointments.setStatus(appointmentId, newStatus);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Appointment updated");
    } catch (error) {
      toast.error(isApiError(error) ? error.message : "Failed to update appointment");
    } finally {
      setChangingAppointmentId(null);
    }
  }

  const ACTION_LABELS: Record<AppointmentStatus, string> = {
    CONFIRMED: "Confirm",
    IN_PROGRESS: "Start",
    COMPLETED: "Complete",
    CANCELLED: "Cancel",
    TIMED_OUT: "Time Out",
    PENDING: "Pending",
  };

  function isTransitionAllowed(from: AppointmentStatus, to: AppointmentStatus): boolean {
    return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
  }

  function getAvailableTransitions(appointmentStatus: AppointmentStatus): AppointmentStatus[] {
    return (ALLOWED_STATUS_TRANSITIONS[appointmentStatus] ?? []).filter((s) => s !== "TIMED_OUT");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Appointments"
        description="View and manage your appointments"
      />

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-foreground block mb-2">
              Date
            </label>
            <input
              type="date"
              value={date ?? ""}
              onChange={(e) => setDate(e.target.value || undefined)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Button
              variant={filterCurrentSlot ? "default" : "outline"}
              size="sm"
              className="h-[38px]"
              onClick={() => setFilterCurrentSlot((prev) => !prev)}
            >
              <Clock aria-hidden className="h-4 w-4 mr-1.5" />
              {filterCurrentSlot ? "Current Time Slot (Active)" : "Current Time Slot"}
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <Tabs value={status} onValueChange={(val) => {
          setStatus(val as TabValue);
          setPage(1);
        }}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="TIMED_OUT">Timed Out</TabsTrigger>
          </TabsList>

          {["ALL", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "TIMED_OUT"].map((tabStatus) => (
            <TabsContent key={tabStatus} value={tabStatus} className="mt-6">
              {isLoading ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Time Slot</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, i) => (
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
                            <Skeleton className="h-4 w-24 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : appointments.length === 0 ? (
                <EmptyState
                  title={filterCurrentSlot ? "No appointments in current time slot" : "No appointments"}
                  description={
                    filterCurrentSlot
                      ? "No appointments match the current time slot for the selected filters"
                      : "No appointments found for the selected filters"
                  }
                />
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time Slot</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment: Appointment) => {
                        const transitions = getAvailableTransitions(appointment.status);
                        return (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <Link
                                href={`/patients/${appointment.patient?.id ?? ""}`}
                                className="font-medium text-primary-subtle-foreground hover:underline"
                              >
                                {appointment.patient?.name ?? "Unknown"}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              <div className="font-medium text-foreground">
                                {new Date(appointment.scheduledFor).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground font-normal">
                                {formatTimeSlot(appointment.scheduledFor)}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {appointment.reason}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={appointment.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {transitions.map((nextStatus) => (
                                  <Button
                                    key={nextStatus}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(appointment.id, nextStatus)}
                                    disabled={changingAppointmentId === appointment.id}
                                  >
                                    {changingAppointmentId === appointment.id ? (
                                      <Loader2 aria-hidden className="animate-spin" />
                                    ) : (
                                      ACTION_LABELS[nextStatus] ?? nextStatus
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Pagination info */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>
            {(page - 1) * (appointmentsData?.limit ?? 10) + 1} to{" "}
            {Math.min(page * (appointmentsData?.limit ?? 10), total)} of {total}
          </span>
        </div>
      )}
    </div>
  );
}
