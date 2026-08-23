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
import { Badge } from "@upchaar/ui/badge";

import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { useHospital } from "@/components/session-provider";
import { DoctorDialog } from "./doctor-dialog";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { TempPasswordDialog } from "./temp-password-dialog";

export function DoctorsContent() {
  const queryClient = useQueryClient();
  const { data: hospital } = useHospital();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [tempPassword, setTempPassword] = React.useState<string | null>(null);

  const doctorQuery = useQuery({
    queryKey: ["doctors", hospital?.id],
    queryFn: () => (hospital?.id ? api.doctors.list(hospital.id) : []),
    enabled: !!hospital?.id,
  });

  const doctors = doctorQuery.data ?? [];

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ["doctors", hospital?.id] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Doctors" description="Manage hospital doctors and staff" />
        <DoctorDialog
          onSuccess={handleSuccess}
          onTempPassword={setTempPassword}
          hospitalId={hospital?.id}
        >
          <Button>Add doctor</Button>
        </DoctorDialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorQuery.isPending ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{doctor.name}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {(doctor.rating ?? 4.0).toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doctor.email}
                    </TableCell>
                    <TableCell className="text-sm">{doctor.specialization}</TableCell>
                    <TableCell className="text-sm">
                      {doctor.experienceYears} years
                    </TableCell>
                    <TableCell>
                      <Badge variant={doctor.isAvailable ? "default" : "secondary"}>
                        {doctor.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DoctorDialog
                          doctor={doctor}
                          onSuccess={handleSuccess}
                          onTempPassword={setTempPassword}
                          hospitalId={hospital?.id}
                        >
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </DoctorDialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(doctor.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No doctors yet. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {deletingId && (
        <DeleteDoctorDialog
          doctorId={deletingId}
          onSuccess={() => {
            setDeletingId(null);
            handleSuccess();
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {tempPassword && <TempPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />}
    </div>
  );
}
