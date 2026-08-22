"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppointmentStatus } from "@upchaar/types";
import { PageHeader } from "@upchaar/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@upchaar/ui/table";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Button } from "@upchaar/ui/button";
import { Input } from "@upchaar/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@upchaar/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { StatusBadge } from "@upchaar/ui/status-badge";
import { toast } from "@upchaar/ui/sonner";

import { api, type AppointmentListParams } from "@/lib/api";
import { AssignDoctorDialog } from "./assign-doctor-dialog";
import { StatusChangeDialog } from "./status-change-dialog";

const STATUS_TABS = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export function AppointmentsContent() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = React.useState<AppointmentStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const params: AppointmentListParams = {
    status: activeStatus !== "ALL" ? activeStatus : undefined,
    date: dateFilter || undefined,
    departmentId: departmentFilter || undefined,
    page,
    limit: 10,
  };

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", params],
    queryFn: () => api.appointments.list(params),
  });

  const deptQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.departments.list(""),
  });

  const appointments = appointmentsQuery.data?.items ?? [];
  const total = appointmentsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  async function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    try {
      await api.appointments.setStatus(appointmentId, newStatus);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status updated");
      appointmentsQuery.refetch();
    } catch (error) {
      toast.error("Could not update status");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="View and manage all appointments"
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by date"
            />
          </div>
          <div className="flex-1">
            <Select
              value={departmentFilter}
              onValueChange={(val) => {
                setDepartmentFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All departments</SelectItem>
                {deptQuery.data?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs
          value={activeStatus}
          onValueChange={(val) => {
            setActiveStatus(val as AppointmentStatus | "ALL");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            {STATUS_TABS.map((status) => (
              <TabsTrigger key={status} value={status}>
                {status}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeStatus} className="space-y-4">
            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointmentsQuery.isPending ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : appointments.length > 0 ? (
                      appointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.patient?.name || "-"}</TableCell>
                          <TableCell className="text-sm">{apt.department?.name || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(apt.scheduledFor).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {apt.doctor?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={apt.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <AssignDoctorDialog
                                appointmentId={apt.id}
                                currentDoctorId={apt.doctor?.id}
                                departmentId={apt.department?.id || ""}
                              />
                              <StatusChangeDialog
                                appointmentId={apt.id}
                                currentStatus={apt.status}
                                onStatusChange={handleStatusChange}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No appointments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
