"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@upchaar/ui/button";
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

import { api } from "@/lib/api";
import { useHospital } from "@/components/session-provider";
import { DepartmentDialog } from "./department-dialog";
import { DeleteDepartmentDialog } from "./delete-department-dialog";

export function DepartmentsContent() {
  const queryClient = useQueryClient();
  const { data: hospital } = useHospital();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const deptQuery = useQuery({
    queryKey: ["departments", hospital?.id],
    queryFn: () => (hospital?.id ? api.departments.list(hospital.id) : []),
    enabled: !!hospital?.id,
  });

  const departments = deptQuery.data ?? [];

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ["departments", hospital?.id] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Departments" description="Manage hospital departments" />
        <DepartmentDialog onSuccess={handleSuccess} hospitals={hospital ? [hospital] : []}>
          <Button>Add department</Button>
        </DepartmentDialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Avg Consult</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptQuery.isPending ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dept.description || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dept.avgConsultMinutes ? `${dept.avgConsultMinutes} min` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DepartmentDialog
                          department={dept}
                          onSuccess={handleSuccess}
                          hospitals={hospital ? [hospital] : []}
                        >
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </DepartmentDialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(dept.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No departments yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {deletingId && (
        <DeleteDepartmentDialog
          departmentId={deletingId}
          onSuccess={() => {
            setDeletingId(null);
            handleSuccess();
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
