"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { PageHeader } from "@upchaar/ui/page-header";
import { EmptyState } from "@upchaar/ui/empty-state";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";

import { isApiError } from "@/lib/api";
import { usePatientRecord } from "@/lib/queries";

interface PatientRecordContentProps {
  patientId: string;
}

export function PatientRecordContent({ patientId }: PatientRecordContentProps) {
  const router = useRouter();
  const { data: record, isLoading, error } = usePatientRecord(patientId);
  const patient = record?.patient;
  const history = record?.medicalHistory;

  if (isLoading) {
    return <PatientRecordLoadingSkeleton />;
  }

  if (isApiError(error) && error.isForbidden) {
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
                  {history.chronicDiseases.map((disease, idx) => (
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
                  {history.allergies.map((allergy, idx) => (
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
                  {history.pastSurgeries.map((surgery, idx) => (
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
                  {history.currentMedications.map((medication, idx) => (
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
