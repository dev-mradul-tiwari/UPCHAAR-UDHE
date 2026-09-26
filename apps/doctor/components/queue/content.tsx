"use client";

import * as React from "react";
import Link from "next/link";
import { Phone, AlertCircle, Loader2, Play, FileText, CheckCircle2, Share2 } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import { Input } from "@upchaar/ui/input";
import { Switch } from "@upchaar/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@upchaar/ui/table";
import { PageHeader } from "@upchaar/ui/page-header";
import { EmptyState } from "@upchaar/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@upchaar/ui/card";
import { Alert, AlertDescription } from "@upchaar/ui/alert";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Textarea } from "@upchaar/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@upchaar/ui/dialog";
import { toast } from "@upchaar/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";

import { api, isApiError } from "@/lib/api";
import { useDepartmentQueue } from "@/lib/queries";
import { useLiveQueue } from "@/hooks/use-live-queue";
import { useDoctor } from "@/components/session-provider";

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

export function QueueContent() {
  const queryClient = useQueryClient();
  const { data: doctor, isLoading: doctorLoading } = useDoctor();
  const departmentId = doctor?.departmentId ?? null;
  const { data: queue, isLoading: queueLoading } = useDepartmentQueue(departmentId);
  const liveConnection = useLiveQueue(departmentId, !!departmentId);
  const [callingNext, setCallingNext] = React.useState(false);

  // Watch for incoming video requests
  React.useEffect(() => {
    if (liveConnection.videoRequest) {
      // Show toast that auto-dismisses after 1 minute (60000ms)
      toast("Incoming Video Call Request", {
        description: "A Health Worker is waiting for you to join the consultation.",
        duration: 60000,
        action: {
          label: "Accept Call",
          onClick: () => {
            window.open(`/consultation/${liveConnection.videoRequest?.appointmentId}`, "_blank");
          },
        },
      });
    }
  }, [liveConnection.videoRequest]);

  const [notesDialogOpen, setNotesDialogOpen] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [isReferring, setIsReferring] = React.useState(false);
  const [referralReason, setReferralReason] = React.useState("");
  const [targetSpecialization, setTargetSpecialization] = React.useState("");

  const nowServing = queue?.nowServing;
  const entries = queue?.entries ?? [];

  const activeEntry = React.useMemo(
    () => entries.find((e) => e.queueNumber === nowServing || e.status === "IN_PROGRESS"),
    [entries, nowServing],
  );

  async function handleCallNextClick() {
    if (!departmentId) {
      toast.error("Department not assigned");
      return;
    }

    // Enforce mandatory notes for the current active patient before calling next
    if (activeEntry && activeEntry.status === "IN_PROGRESS") {
      toast.error(
        `Please write and save clinical notes for ${activeEntry.patientName} before calling the next patient.`,
      );
      setNotesDialogOpen(true);
      return;
    }

    await executeCallNext();
  }

  async function executeCallNext() {
    if (!departmentId) return;
    setCallingNext(true);
    try {
      await api.queue.callNext(departmentId);
      await queryClient.invalidateQueries({ queryKey: ["queue"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["doctor"] });
      toast.success(queue?.nowServing ? "Next patient called" : "Started serving queue");

      setNotes("");
      setIsReferring(false);
      setReferralReason("");
      setTargetSpecialization("");
      setNotesDialogOpen(true);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : "Failed to call next patient");
    } finally {
      setCallingNext(false);
    }
  }

  async function handleSaveAndComplete() {
    if (!activeEntry) {
      toast.error("No active appointment found");
      return;
    }

    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      toast.error("Clinical notes are required before completing the visit.");
      return;
    }

    if (isReferring && referralReason.trim().length === 0) {
      toast.error("Please enter a reason for referring the patient.");
      return;
    }

    setSavingNotes(true);
    try {
      await api.appointments.setStatus(activeEntry.appointmentId, "COMPLETED", trimmedNotes);

      if (isReferring && activeEntry.patientId && referralReason.trim().length > 0) {
        await api.referrals.create({
          patientId: activeEntry.patientId,
          reason: referralReason.trim(),
          targetSpecialization: targetSpecialization.trim() || undefined,
        });
        toast.success("Consultation saved & Patient referred to other hospitals!");
      } else {
        toast.success("Clinical notes saved & visit completed!");
      }

      await queryClient.invalidateQueries({ queryKey: ["queue"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["doctor"] });
      await queryClient.invalidateQueries({ queryKey: ["referrals"] });

      setNotesDialogOpen(false);
      setNotes("");
      setIsReferring(false);
      setReferralReason("");
      setTargetSpecialization("");
    } catch (error) {
      toast.error(isApiError(error) ? error.message : "Failed to save clinical notes");
    } finally {
      setSavingNotes(false);
    }
  }

  if (doctorLoading) {
    return <QueueLoadingSkeleton />;
  }

  if (!departmentId) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Queue Console"
          description="Manage your department's queue"
        />
        <EmptyState
          title="No department assigned"
          description="Contact your hospital administrator to assign you to a department"
        />
      </div>
    );
  }

  if (queueLoading) {
    return <QueueLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={queue?.departmentName ?? "Queue Console"}
        description="Manage your department's queue"
        actions={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">
              {liveConnection.connection === "live" && "Live"}
              {liveConnection.connection === "connecting" && "Connecting..."}
              {liveConnection.connection === "reconnecting" && "Reconnecting..."}
              {liveConnection.connection === "idle" && "Offline"}
            </span>
            <span
              className={`inline-block size-2 rounded-full ${
                liveConnection.connection === "live" ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-hidden
            />
          </div>
        }
      />

      {/* Current patient being served */}
      {nowServing ? (
        <Card className="border-primary-subtle bg-primary-subtle">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary-subtle-foreground">Now Serving</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200"
                onClick={() => window.open(`/consultation/${activeEntry?.appointmentId}`, "_blank")}
              >
                <AlertCircle aria-hidden className="size-4 text-blue-600" />
                Join Video Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 bg-background/80 hover:bg-background text-foreground"
                onClick={() => setNotesDialogOpen(true)}
              >
                <FileText aria-hidden className="size-4 text-primary" />
                Write Clinical Notes
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary-subtle-foreground">
                #{nowServing}
              </p>
              <p className="text-sm font-semibold text-primary-subtle-foreground">
                Patient:{" "}
                {activeEntry?.patientId ? (
                  <Link
                    href={`/patients/${activeEntry.patientId}`}
                    className="font-bold underline hover:opacity-80"
                  >
                    {activeEntry.patientName}
                  </Link>
                ) : (
                  activeEntry?.patientName ?? "Active Patient"
                )}
              </p>
              {activeEntry?.reason ? (
                <p className="text-xs text-primary-subtle-foreground/80">
                  Reason: {activeEntry.reason}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No one is being served right now</AlertDescription>
        </Alert>
      )}

      {/* Waiting queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Waiting Queue
            </h2>
            <p className="text-sm text-muted-foreground">
              {entries.length} patient{entries.length !== 1 ? "s" : ""} waiting
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!nowServing ? (
              <Button
                size="lg"
                onClick={handleCallNextClick}
                disabled={callingNext || entries.length === 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              >
                {callingNext ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    Starting serving...
                  </>
                ) : (
                  <>
                    <Play aria-hidden className="size-4 fill-current" />
                    Start serving
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleCallNextClick}
                disabled={callingNext || entries.length === 0}
                className="gap-2"
              >
                {callingNext ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    Calling next
                  </>
                ) : (
                  <>
                    <Phone aria-hidden className="size-4" />
                    Call next
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="Queue is empty"
            description="No patients waiting at the moment"
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Queue #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Scheduled Slot</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.appointmentId}>
                    <TableCell className="font-bold text-lg text-primary">
                      #{entry.queueNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.patientId ? (
                        <Link
                          href={`/patients/${entry.patientId}`}
                          className="font-medium text-primary-subtle-foreground hover:underline"
                        >
                          {entry.patientName}
                        </Link>
                      ) : (
                        entry.patientName
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.reason}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatTimeSlot(entry.scheduledFor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium text-muted-foreground">
                        {entry.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Clinical Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-md p-5 gap-4">
          <DialogHeader className="gap-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText aria-hidden className="size-4 text-primary" />
              Clinical Consultation Notes
            </DialogTitle>
            <DialogDescription className="text-xs">
              Write prescription or diagnosis for{" "}
              <strong className="text-foreground">{activeEntry?.patientName ?? "Patient"}</strong> (Queue #{nowServing ?? "1"}).
              Notes are saved directly to patient health records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border/80 bg-muted/40 p-2.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-medium text-foreground">{doctor?.name ?? "Attending Doctor"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hospital:</span>
                <span className="font-medium text-foreground">{doctor?.hospitalName ?? "Hospital Care"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason:</span>
                <span className="font-medium text-foreground">{activeEntry?.reason ?? "General Consultation"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Doctor's Clinical Notes / Prescription <span className="text-destructive">*</span>
              </label>
              <Textarea
                rows={3}
                maxLength={1000}
                placeholder="Write clinical diagnosis, prescribed medicines, dosage, or follow-up advice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm resize-none"
              />
            </div>

            {/* Refer Patient Toggle & Section */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Share2 className="size-3.5 text-primary" />
                  Refer Patient to Other Hospitals & Doctors
                </span>
                <Switch
                  checked={isReferring}
                  onCheckedChange={setIsReferring}
                  aria-label="Refer patient to other hospitals"
                />
              </div>

              {isReferring && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Why do you want to refer this patient? <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Specify critical condition, special care needed, or reason for referral..."
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Target Specialization (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Cardiology, Neurosurgery, ICU"
                      value={targetSpecialization}
                      onChange={(e) => setTargetSpecialization(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNotesDialogOpen(false)}
              disabled={savingNotes}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAndComplete}
              loading={savingNotes}
              disabled={notes.trim().length === 0}
              className="gap-1.5"
            >
              <CheckCircle2 aria-hidden className="size-4" />
              Save & Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QueueLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Queue #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
