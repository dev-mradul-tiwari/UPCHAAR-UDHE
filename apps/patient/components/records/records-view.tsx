"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CigaretteOff,
  ClipboardList,
  Droplet,
  Mail,
  Pencil,
  Phone,
  Pill,
  Save,
  Scissors,
  ShieldAlert,
  Wine,
  X,
} from "lucide-react";
import {
  medicalHistorySchema,
  type MedicalHistory,
  type MedicalHistoryInput,
} from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Badge } from "@upchaar/ui/badge";
import { Button } from "@upchaar/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@upchaar/ui/card";
import { FormField } from "@upchaar/ui/form-field";
import { PageHeader } from "@upchaar/ui/page-header";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Switch } from "@upchaar/ui/switch";
import { Textarea } from "@upchaar/ui/textarea";
import { toast } from "@upchaar/ui/sonner";

import { FormAlert } from "@/components/form-alert";
import { ListInput } from "@/components/list-input";
import { api, errorMessage, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { formatAge, formatDateTime, formatGender } from "@/lib/format";
import { queryKeys, useMedicalRecord } from "@/lib/queries";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

type Draft = {
  chronicDiseases: string[];
  allergies: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  smoking: boolean;
  alcohol: boolean;
  notes: string;
};

const EMPTY_DRAFT: Draft = {
  chronicDiseases: [],
  allergies: [],
  pastSurgeries: [],
  currentMedications: [],
  smoking: false,
  alcohol: false,
  notes: "",
};

function toDraft(history: MedicalHistory | null): Draft {
  if (history === null) return EMPTY_DRAFT;
  return {
    chronicDiseases: history.chronicDiseases,
    allergies: history.allergies,
    pastSurgeries: history.pastSurgeries,
    currentMedications: history.currentMedications,
    smoking: history.smoking,
    alcohol: history.alcohol,
    notes: history.notes ?? "",
  };
}

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="secondary">{item}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function RecordsView() {
  const queryClient = useQueryClient();
  const { data: record, isPending, error } = useMedicalRecord();

  const [editing, setEditing] = React.useState(false);
  const [editingPhone, setEditingPhone] = React.useState(false);
  const [newPhone, setNewPhone] = React.useState("");
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);

  const updatePhoneMutation = useMutation({
    mutationFn: (phone: string) => api.records.updatePhone(phone),
    onSuccess: (updatedRecord) => {
      queryClient.setQueryData(queryKeys.records(), updatedRecord);
      setEditingPhone(false);
      toast.success("Mobile number updated successfully", {
        description: "All future SMS alerts will be sent exclusively to your new mobile number.",
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update mobile number.");
    },
  });

  const save = useMutation({
    mutationFn: (input: MedicalHistoryInput) => api.records.save(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.records(), updated);
      setEditing(false);
      setFailure(null);
      setErrors({});
      toast.success("Health records updated");
    },
    onError: (failed: unknown) => {
      setErrors(fieldErrorsOf(failed));
      setFailure(failed);
      toast.error("We could not save that", { description: errorMessage(failed) });
    },
  });

  function startEditing() {
    setDraft(toDraft(record?.medicalHistory ?? null));
    setErrors({});
    setFailure(null);
    setEditing(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.notes.trim();
    const parsed = medicalHistorySchema.safeParse({
      ...draft,
      notes: trimmed.length > 0 ? trimmed : null,
    });

    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    save.mutate(parsed.data);
  }

  if (isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error !== null || record === undefined) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Health records" />
        <Alert variant="destructive">
          <ShieldAlert aria-hidden />
          <AlertTitle>We could not open your records</AlertTitle>
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { patient, medicalHistory } = record;
  const view = toDraft(medicalHistory);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Health records"
        title="Your medical history"
        description="Doctors treating you can see this. Keeping it current makes your visits safer."
        actions={
          editing ? null : (
            <Button type="button" onClick={startEditing}>
              <Pencil aria-hidden />
              Edit records
            </Button>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{patient.name}</CardTitle>
          <CardDescription>
            {formatGender(patient.gender)} · {formatAge(patient.dateOfBirth)} years old
          </CardDescription>
          <CardAction>
            <Badge variant="destructive" className="gap-1.5">
              <Droplet aria-hidden />
              {patient.bloodGroup ?? "Blood group not set"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">Email</dt>
              <dd className="truncate text-foreground">{patient.email}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">Phone</dt>
              {editingPhone ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updatePhoneMutation.mutate(newPhone);
                  }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="h-8 px-2 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button size="sm" type="submit" loading={updatePhoneMutation.isPending} className="h-8 px-3 text-xs">
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => setEditingPhone(false)}
                    className="h-8 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <dd className="flex items-center gap-2.5 text-foreground">
                  <span>{patient.phone}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPhone(patient.phone);
                      setEditingPhone(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <Pencil className="size-3" />
                    Edit
                  </button>
                </dd>
              )}
            </div>
          </dl>
        </CardContent>
      </Card>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit your medical history</CardTitle>
            <CardDescription>
              Add or remove entries, then save. Nothing is shared outside your care team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
              <FormAlert error={failure} fallback="We could not save your records." />

              <FormField
                label="Ongoing conditions"
                error={firstError(errors, "chronicDiseases")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Ongoing conditions"
                    placeholder="e.g. Asthma"
                    emptyHint="No ongoing conditions recorded."
                    value={draft.chronicDiseases}
                    onChange={(chronicDiseases) =>
                      setDraft((current) => ({ ...current, chronicDiseases }))
                    }
                  />
                )}
              </FormField>

              <FormField label="Allergies" error={firstError(errors, "allergies")}>
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Allergies"
                    placeholder="e.g. Penicillin"
                    emptyHint="No allergies recorded."
                    value={draft.allergies}
                    onChange={(allergies) =>
                      setDraft((current) => ({ ...current, allergies }))
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Past surgeries"
                error={firstError(errors, "pastSurgeries")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Past surgeries"
                    placeholder="e.g. Appendectomy 2019"
                    emptyHint="No surgeries recorded."
                    value={draft.pastSurgeries}
                    onChange={(pastSurgeries) =>
                      setDraft((current) => ({ ...current, pastSurgeries }))
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Current medications"
                error={firstError(errors, "currentMedications")}
              >
                {(field) => (
                  <ListInput
                    {...field}
                    listLabel="Current medications"
                    placeholder="e.g. Salbutamol inhaler"
                    emptyHint="No medications recorded."
                    value={draft.currentMedications}
                    onChange={(currentMedications) =>
                      setDraft((current) => ({ ...current, currentMedications }))
                    }
                  />
                )}
              </FormField>

              <fieldset className="grid gap-3 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-medium text-foreground">
                  Lifestyle
                </legend>
                <label
                  htmlFor="records-smoking"
                  className="flex items-center justify-between gap-4 text-sm text-foreground"
                >
                  <span>I smoke</span>
                  <Switch
                    id="records-smoking"
                    checked={draft.smoking}
                    onCheckedChange={(smoking) =>
                      setDraft((current) => ({ ...current, smoking }))
                    }
                  />
                </label>
                <label
                  htmlFor="records-alcohol"
                  className="flex items-center justify-between gap-4 text-sm text-foreground"
                >
                  <span>I drink alcohol</span>
                  <Switch
                    id="records-alcohol"
                    checked={draft.alcohol}
                    onCheckedChange={(alcohol) =>
                      setDraft((current) => ({ ...current, alcohol }))
                    }
                  />
                </label>
              </fieldset>

              <FormField
                label="Notes for your doctor"
                description="Symptoms, triggers, anything worth mentioning."
                error={firstError(errors, "notes")}
              >
                {(field) => (
                  <Textarea
                    {...field}
                    rows={4}
                    maxLength={2000}
                    placeholder="Uses inhaler during seasonal flare-ups."
                    value={draft.notes}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                )}
              </FormField>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="sm:w-40"
                  onClick={() => {
                    setEditing(false);
                    setFailure(null);
                    setErrors({});
                  }}
                >
                  <X aria-hidden />
                  Discard
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  loading={save.isPending}
                >
                  {save.isPending ? "Saving" : "Save records"}
                  {save.isPending ? null : <Save aria-hidden />}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity aria-hidden className="size-4 text-primary" />
                Ongoing conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChipList items={view.chronicDiseases} empty="Nothing recorded." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert aria-hidden className="size-4 text-primary" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChipList items={view.allergies} empty="No known allergies." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scissors aria-hidden className="size-4 text-primary" />
                Past surgeries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChipList items={view.pastSurgeries} empty="No surgeries recorded." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Pill aria-hidden className="size-4 text-primary" />
                Current medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChipList items={view.currentMedications} empty="No medications recorded." />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList aria-hidden className="size-4 text-primary" />
                Lifestyle and notes
              </CardTitle>
              {medicalHistory !== null ? (
                <CardDescription>
                  Last updated {formatDateTime(medicalHistory.updatedAt)}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-4">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Badge variant={view.smoking ? "warning" : "muted"}>
                    <CigaretteOff aria-hidden />
                    {view.smoking ? "Smokes" : "Does not smoke"}
                  </Badge>
                </li>
                <li>
                  <Badge variant={view.alcohol ? "warning" : "muted"}>
                    <Wine aria-hidden />
                    {view.alcohol ? "Drinks alcohol" : "No alcohol"}
                  </Badge>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {view.notes.length > 0 ? view.notes : "No notes added yet."}
              </p>
            </CardContent>
          </Card>

          {/* Doctor Consultations & Prescriptions */}
          <Card className="md:col-span-2 border-primary/20 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-primary">
                <Activity aria-hidden className="size-4 text-primary" />
                Doctor Consultations & Prescriptions
              </CardTitle>
              <CardDescription>
                Clinical notes, prescriptions, and advice recorded by doctors during your hospital visits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {record.consultations && record.consultations.length > 0 ? (
                <div className="grid gap-4">
                  {record.consultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
                            <span>{consultation.doctorName}</span>
                            {consultation.doctorDepartment ? (
                              <span className="text-xs font-normal text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-md">
                                {consultation.doctorDepartment}
                              </span>
                            ) : null}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {consultation.hospitalName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-primary-subtle-foreground bg-primary/10 px-2.5 py-1 rounded-full inline-block">
                            {formatDateTime(consultation.date)}
                          </span>
                        </div>
                      </div>

                      {consultation.reason ? (
                        <p className="text-xs text-muted-foreground">
                          <strong className="text-foreground">Visit reason:</strong> {consultation.reason}
                        </p>
                      ) : null}

                      <div className="rounded-lg bg-card p-3 border border-border/60">
                        <p className="text-xs font-semibold text-foreground mb-1">Doctor's Clinical Notes / Prescription:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {consultation.notes}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No completed consultation notes recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
