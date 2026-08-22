"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@upchaar/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@upchaar/ui/table";
import { PageHeader } from "@upchaar/ui/page-header";

import { api } from "@/lib/api";

export function DashboardContent() {
  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.hospital.stats(),
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your hospital operations"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Appointments Today"
          value={stats?.appointmentsToday ?? 0}
          loading={statsQuery.isPending}
        />
        <StatCard
          label="Bed Occupancy"
          value={`${stats?.bedOccupancyPct ?? 0}%`}
          loading={statsQuery.isPending}
        />
        <StatCard
          label="Low Stock Items"
          value={stats?.lowStockCount ?? 0}
          loading={statsQuery.isPending}
        />
        <StatCard
          label="Doctors"
          value={stats?.doctorCount ?? 0}
          loading={statsQuery.isPending}
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Department Load</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.departmentLoad && stats.departmentLoad.length > 0 ? (
                stats.departmentLoad.map((dept) => (
                  <TableRow key={dept.departmentId}>
                    <TableCell className="font-medium">{dept.departmentName}</TableCell>
                    <TableCell className="text-right">{dept.total}</TableCell>
                    <TableCell className="text-right text-warning-foreground">
                      {dept.waiting}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No department data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
