"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, CalendarClock, FileText } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { PageHeader } from "@upchaar/ui/page-header";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { EmptyState } from "@upchaar/ui/empty-state";
import { Skeleton } from "@upchaar/ui/skeleton";
import { api, isApiError } from "@/lib/api";

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

interface PatientRecordContentProps {
  patientId: string;
}

export function PatientRecordContent({ patientId }: PatientRecordContentProps) {
  const router = useRouter();

  const { data: record, isLoading, error } = useQuery({
    queryKey: ["patient-record", patientId],
    queryFn: () => api.records.patientRecord(patientId),
    enabled: !!patientId,
  });

  const patient = record?.patient;
  const history = record?.medicalHistory;

  if (isLoading) {
    return <PatientRecordLoadingSkeleton />;
  }

  if (isApiError(error) && error.status === 403) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <EmptyState
          title="Access denied"
          description="You do not have permission to view this patient's record"
        />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could not load patient record</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An error occurred"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
      </div>

      <PageHeader
        title={patient.name}
        description={`${patient.email} · ${patient.phone}`}
      />

      {/* Patient demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
            <p className="text-base text-foreground">
              {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <p className="text-base text-foreground">{patient.gender || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
            <p className="text-base text-foreground">{patient.bloodGroup || "Not provided"}</p>
          </div>
        </CardContent>
      </Card>

      {history ? (
        <>
          {/* Chronic diseases */}
          {history.chronicDiseases && history.chronicDiseases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chronic Diseases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {history.chronicDiseases.map((disease: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allergies */}
          {history.allergies && history.allergies.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Allergies</CardTitle>
                <CardDescription>Important allergy information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {history.allergies.map((allergy: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-destructive/20 px-3 py-1 text-sm font-medium text-destructive"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past surgeries */}
          {history.pastSurgeries && history.pastSurgeries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Surgeries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.pastSurgeries.map((surgery: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-foreground">{surgery}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current medications */}
          {history.currentMedications && history.currentMedications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.currentMedications.map((medication: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-foreground">{medication}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lifestyle */}
          {(history.smoking || history.alcohol) && (
            <Card>
              <CardHeader>
                <CardTitle>Lifestyle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.smoking && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Smoking:</span>
                    <span className="text-sm text-foreground">Active</span>
                  </div>
                )}
                {history.alcohol && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Alcohol:</span>
                    <span className="text-sm text-foreground">Active</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {history.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{history.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <EmptyState
          title="No medical history"
          description="This patient has not provided their medical history yet"
        />
      )}

      {/* Completed Consultation Records History */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Consultation Records</CardTitle>
          <CardDescription>
            Record of all completed consultations and doctor prescriptions for this patient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {record.consultations && record.consultations.length > 0 ? (
            <div className="space-y-4">
              {record.consultations.map((c: any) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <CalendarClock className="size-4 text-primary" />
                        {new Date(c.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {c.scheduledFor ? ` · ${formatTimeSlot(c.scheduledFor)}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.hospitalName} {c.doctorDepartment ? `· ${c.doctorDepartment}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Doctor</p>
                      <p className="font-medium text-foreground">{c.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Reason for visit</p>
                      <p className="text-foreground">{c.reason}</p>
                    </div>
                  </div>

                  {c.notes ? (
                    <div className="rounded-md bg-muted/60 p-3 text-xs space-y-1 border border-border/50">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="size-3.5 text-primary" />
                        Doctor's Clinical Notes / Prescription
                      </p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{c.notes}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No completed consultation records found for this patient.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PatientRecordLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-6 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
