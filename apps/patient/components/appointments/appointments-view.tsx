"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CalendarX2, Ban } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
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
import { Pagination } from "@upchaar/ui/pagination";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@upchaar/ui/tabs";
import { toast } from "@upchaar/ui/sonner";

import { AppointmentCard } from "@/components/appointments/appointment-card";
import { api, errorMessage } from "@/lib/api";
import { useMyAppointments } from "@/lib/queries";

type Filter = AppointmentStatus | "ALL";

const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "TIMED_OUT", label: "Timed Out" },
];

const CANCELLABLE: readonly AppointmentStatus[] = ["PENDING", "CONFIRMED"];
const PAGE_SIZE = 10;

export function AppointmentsView() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [page, setPage] = React.useState(1);
  const [pendingCancel, setPendingCancel] = React.useState<Appointment | null>(null);

  const { data, isPending, error } = useMyAppointments(filter, page, PAGE_SIZE);

  const cancel = useMutation({
    mutationFn: (id: string) => api.appointments.cancel(id),
    onSuccess: async () => {
      setPendingCancel(null);
      toast.success("Appointment cancelled", {
        description: "Your place in that queue has been released.",
      });
      await queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
    },
    onError: (failure: unknown) => {
      toast.error("We could not cancel that", { description: errorMessage(failure) });
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Your care"
        title="My appointments"
        description="Everything you have booked, with your live queue token on each one."
        actions={
          <Button asChild>
            <Link href="/appointments/new">
              <CalendarPlus aria-hidden />
              Book appointment
            </Link>
          </Button>
        }
      />

      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as Filter);
          setPage(1);
        }}
      >
        <TabsList className="w-full max-w-full justify-start overflow-x-auto">
          {FILTERS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error !== null ? (
        <Alert variant="destructive">
          <CalendarX2 aria-hidden />
          <AlertTitle>We could not load your appointments</AlertTitle>
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}

      {isPending ? (
        <ul className="grid gap-4">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-56 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 />}
          title={
            filter === "ALL"
              ? "You have no appointments yet"
              : `No ${filter.toLowerCase().replace("_", " ")} appointments`
          }
          description={
            filter === "ALL"
              ? "Find a hospital, pick a department and you will get a queue token straight away."
              : "Try a different filter to see the rest of your bookings."
          }
          action={
            <Button asChild>
              <Link href="/appointments/new">Book an appointment</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="grid gap-4">
            {items.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  action={
                    CANCELLABLE.includes(appointment.status) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingCancel(appointment)}
                      >
                        <Ban aria-hidden />
                        Cancel
                      </Button>
                    ) : null
                  }
                />
              </li>
            ))}
          </ul>

          <Pagination
            page={data?.page ?? page}
            total={data?.total ?? items.length}
            limit={data?.limit ?? PAGE_SIZE}
            itemLabel="appointments"
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog
        open={pendingCancel !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCancel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>
              {pendingCancel === null
                ? null
                : `Your token #${pendingCancel.queueNumber} at ${
                    pendingCancel.hospital?.name ?? "the hospital"
                  } will be released and the queue will move up.`}
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
              onClick={() => {
                if (pendingCancel !== null) cancel.mutate(pendingCancel.id);
              }}
            >
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
