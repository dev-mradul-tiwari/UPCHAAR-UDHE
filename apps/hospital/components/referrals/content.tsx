"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHospital } from "@/components/session-provider";
import {
  Building2,
  Stethoscope,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Share2,
} from "lucide-react";
import type { Referral } from "@upchaar/types";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { PageHeader } from "@upchaar/ui/page-header";
import { Skeleton } from "@upchaar/ui/skeleton";
import { EmptyState } from "@upchaar/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@upchaar/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { toast } from "@upchaar/ui/sonner";

import { api, isApiError } from "@/lib/api";

export function HospitalReferralsContent() {
  const queryClient = useQueryClient();
  const { data: currentHospital } = useHospital();
  const currentHospitalId = currentHospital?.id;

  const [activeTab, setActiveTab] = React.useState<"INCOMING" | "SENT">("INCOMING");
  const [targetReferral, setTargetReferral] = React.useState<Referral | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>("NONE");
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);
  const [selectedReferral, setSelectedReferral] = React.useState<Referral | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);

  const { data: referrals, isLoading, error } = useQuery({
    queryKey: ["referrals"],
    queryFn: () => api.referrals.list(),
  });

  const doctorsQuery = useQuery({
    queryKey: ["doctors-list", currentHospitalId],
    queryFn: () => (currentHospitalId ? api.doctors.list(currentHospitalId) : Promise.resolve([])),
    enabled: !!currentHospitalId,
  });

  const connectMutation = useMutation({
    mutationFn: ({ referralId, doctorId }: { referralId: string; doctorId?: string }) =>
      api.referrals.connect(referralId, { doctorId }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["referrals"], (old: Referral[] | undefined) =>
        old ? old.map((r) => (r.id === updated.id ? updated : r)) : [updated],
      );
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      setSelectedReferral(updated);
      setAssignModalOpen(false);
      setConfirmModalOpen(true);
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.message : "Failed to connect with patient");
    },
  });

  if (isLoading) {
    return <ReferralsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Referred Patients" description="Patients referred for specialized care" />
        <EmptyState
          title="Could not load referrals"
          description={error instanceof Error ? error.message : "An error occurred"}
        />
      </div>
    );
  }

  const all = referrals ?? [];

  const sentReferrals = all.filter((r) => r.referringHospitalId === currentHospitalId);
  const incomingReferrals = all.filter((r) => r.referringHospitalId !== currentHospitalId);

  const activeList = activeTab === "INCOMING" ? incomingReferrals : sentReferrals;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Referred Patients"
        description="View incoming patient referrals or track status of referrals from your hospital"
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("INCOMING")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "INCOMING"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-4" />
          Incoming Referrals ({incomingReferrals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SENT")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "SENT"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Share2 className="size-4" />
          Hospital Referrals Sent ({sentReferrals.length})
        </button>
      </div>

      {activeList.length === 0 ? (
        <EmptyState
          title={activeTab === "INCOMING" ? "No incoming referrals" : "No referrals sent"}
          description={
            activeTab === "INCOMING"
              ? "There are currently no incoming patient referrals from other hospitals."
              : "No patients have been referred from your hospital yet."
          }
        />
      ) : (
        <div className="grid gap-6">
          {activeList.map((referral) => {
            const isConnected = referral.status === "CONNECTED";
            const isSelfReferral = referral.referringHospitalId === currentHospitalId;
            const isConnectedByMe = referral.connectedHospitalId === currentHospitalId;

            return (
              <Card
                key={referral.id}
                className={`transition-all ${
                  isConnected ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Link
                          href={`/patients/${referral.patientId}`}
                          className="hover:underline hover:text-primary transition-colors cursor-pointer"
                        >
                          {referral.patientName}
                        </Link>
                        {referral.patientAge ? (
                          <span className="text-xs font-normal text-muted-foreground">
                            ({referral.patientAge} yrs{referral.patientGender ? `, ${referral.patientGender}` : ""})
                          </span>
                        ) : null}
                        {isSelfReferral ? (
                          <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-2xs font-semibold text-secondary-foreground">
                            Your Hospital Referral
                          </span>
                        ) : null}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {referral.patientPhone} · {referral.patientEmail}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                          <CheckCircle2 className="size-3.5" />
                          {isConnectedByMe
                            ? "Connected by Your Hospital"
                            : `Connected by ${referral.connectedHospitalName ?? "Doctor"}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                          <Clock className="size-3.5" />
                          Open Referral
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Referring Doctor & Hospital info */}
                  <div className="grid gap-3 rounded-lg border border-border/80 bg-muted/30 p-3.5 text-xs sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Stethoscope className="size-3.5 text-primary" />
                        Referred By Doctor
                      </p>
                      <p className="text-foreground font-medium">{referral.referringDoctorName}</p>
                      <p className="text-muted-foreground">{referral.referringDoctorSpecialization}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-primary" />
                        Referring Hospital
                      </p>
                      <p className="text-foreground font-medium">{referral.referringHospitalName}</p>
                      <p className="text-muted-foreground">{referral.referringHospitalCity}</p>
                    </div>
                  </div>

                  {/* Referral Reason */}
                  <div className="space-y-1 rounded-md bg-card p-3 border border-border/60">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 text-amber-500" />
                      Reason for Referral / Critical Condition:
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {referral.reason}
                    </p>
                    {referral.targetSpecialization ? (
                      <p className="text-2xs text-primary font-medium mt-1">
                        Requested Specialization: {referral.targetSpecialization}
                      </p>
                    ) : null}
                  </div>

                  {/* Connected Info for Self Referral */}
                  {isSelfReferral && isConnected ? (
                    <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs space-y-1">
                      <p className="font-semibold text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" />
                        Referral Accepted & Received
                      </p>
                      <p className="text-foreground">
                        {referral.connectedDoctorName ? `Dr. ${referral.connectedDoctorName}` : "Doctor"} at{" "}
                        <strong className="font-semibold">{referral.connectedHospitalName}</strong> connected with this patient for follow-up treatment.
                      </p>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-2xs text-muted-foreground">
                      Referred on: {new Date(referral.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {!isSelfReferral ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setTargetReferral(referral);
                          setSelectedDoctorId("NONE");
                          setAssignModalOpen(true);
                        }}
                        disabled={isConnected || connectMutation.isPending}
                        className="gap-1.5"
                      >
                        <UserCheck className="size-4" />
                        {isConnectedByMe
                          ? "Connected"
                          : isConnected
                          ? `Connected by ${referral.connectedHospitalName ?? "Other Hospital"}`
                          : "Connect with Patient"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium italic">
                        {isConnected ? "Received by Specialist" : "Waiting for Specialist Connection"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Select Specialist Doctor Modal for Hospital */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-lg">
              Assign Specialist Doctor & Connect
            </DialogTitle>
            <DialogDescription className="text-sm">
              Select a doctor from your hospital to handle follow-up treatment for <strong className="text-foreground">{targetReferral?.patientName}</strong>:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Assigned Specialist Doctor
              </label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Hospital General Care (Default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Hospital General Care (Default)</SelectItem>
                  {(doctorsQuery.data ?? []).map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      Dr. {doc.name} ({doc.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={connectMutation.isPending}
              onClick={() => {
                if (targetReferral) {
                  connectMutation.mutate({
                    referralId: targetReferral.id,
                    doctorId: selectedDoctorId !== "NONE" ? selectedDoctorId : undefined,
                  });
                }
              }}
            >
              Connect & Notify Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal Popup */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="gap-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg">
              Patient Notified
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              The patient <strong className="text-foreground">{selectedReferral?.patientName}</strong> has been notified that your hospital wants to connect regarding their referral from <strong className="text-foreground">{selectedReferral?.referringDoctorName?.startsWith("Dr.") ? selectedReferral?.referringDoctorName : `Dr. ${selectedReferral?.referringDoctorName}`}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center pt-2">
            <Button onClick={() => setConfirmModalOpen(false)} className="w-full sm:w-32">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReferralsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
