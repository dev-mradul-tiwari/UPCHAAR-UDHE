"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarCheck, Info } from "lucide-react";
import { bookAppointmentSchema, type BookAppointmentInput } from "@upchaar/types";
import { Alert, AlertDescription, AlertTitle } from "@upchaar/ui/alert";
import { Button } from "@upchaar/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { DateInput, todayInputValue } from "@upchaar/ui/date-input";
import { FormField } from "@upchaar/ui/form-field";
import { PageHeader } from "@upchaar/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@upchaar/ui/select";
import { Textarea } from "@upchaar/ui/textarea";
import { toast } from "@upchaar/ui/sonner";

import { FormAlert } from "@/components/form-alert";
import { api, fieldErrorsOf, type FieldErrors } from "@/lib/api";
import { toIsoDateTime } from "@/lib/format";
import { useAvailableSlots, useDepartments, useDoctors, useHospitals } from "@/lib/queries";
import { firstError, issuesToFieldErrors } from "@/lib/validation";

const NO_PREFERENCE = "ANY";

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  const hStr = parts[0];
  const mStr = parts[1];
  if (!hStr) return timeStr;
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const m = mStr || "00";
  const ampm = (h >= 12 && h < 24) ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function BookAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hospitalId, setHospitalId] = React.useState(
    () => searchParams.get("hospitalId") ?? "",
  );
  const [departmentId, setDepartmentId] = React.useState(
    () => searchParams.get("departmentId") ?? "",
  );
  const [doctorId, setDoctorId] = React.useState(NO_PREFERENCE);
  const [date, setDate] = React.useState(() => todayInputValue());
  const [time, setTime] = React.useState("");
  const [reason, setReason] = React.useState("");

  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [failure, setFailure] = React.useState<unknown>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const hospitals = useHospitals({ limit: 100 });
  const departments = useDepartments(hospitalId.length > 0 ? hospitalId : undefined);
  const doctors = useDoctors(
    hospitalId.length > 0 ? hospitalId : undefined,
    departmentId.length > 0 ? departmentId : undefined,
  );
  const slotsQuery = useAvailableSlots(
    hospitalId.length > 0 ? hospitalId : undefined,
    departmentId.length > 0 ? departmentId : undefined,
    date.length > 0 ? date : undefined,
  );

  const hospitalOptions = hospitals.data?.items ?? [];
  const departmentOptions = React.useMemo(
    () => (hospitalId.length > 0 ? (departments.data ?? []) : []),
    [departments.data, hospitalId],
  );
  const doctorOptions = React.useMemo(
    () => (doctors.data ?? []).filter((doctor) => doctor.isAvailable),
    [doctors.data],
  );

  const selectedDepartment = departmentOptions.find(
    (department) => department.id === departmentId,
  );

  function handleHospitalChange(value: string) {
    setHospitalId(value);
    setDepartmentId("");
    setDoctorId(NO_PREFERENCE);
  }

  function handleDepartmentChange(value: string) {
    setDepartmentId(value);
    setDoctorId(NO_PREFERENCE);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    const scheduledFor = toIsoDateTime(date, time);
    if (scheduledFor === null) {
      setErrors({ scheduledFor: ["Pick both a date and a time for your visit"] });
      return;
    }

    const parsed = bookAppointmentSchema.safeParse({
      hospitalId,
      departmentId,
      doctorId: doctorId === NO_PREFERENCE ? undefined : doctorId,
      reason,
      scheduledFor,
    });

    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const input: BookAppointmentInput = parsed.data;
      const appointment = await api.appointments.book(input);
      toast.success("Appointment booked", {
        description: `You are token #${appointment.queueNumber} in ${
          appointment.department?.name ?? "the department"
        }.`,
      });
      router.push(`/appointments/${appointment.id}`);
    } catch (error) {
      setErrors(fieldErrorsOf(error));
      setFailure(error);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/appointments">
            <ArrowLeft aria-hidden />
            Back to appointments
          </Link>
        </Button>
        <PageHeader
          eyebrow="New booking"
          title="Book an appointment"
          description="Choose where you want to be seen. You will get a queue token straight away and can follow it live."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
          <CardDescription>
            A doctor is optional — the hospital will assign one if you have no preference.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
            <FormAlert error={failure} fallback="We could not book that appointment." />

            <FormField label="Hospital" error={firstError(errors, "hospitalId")} required>
              {(field) => (
                <Select
                  value={hospitalId.length > 0 ? hospitalId : undefined}
                  onValueChange={handleHospitalChange}
                  disabled={hospitals.isPending}
                >
                  <SelectTrigger {...field}>
                    <SelectValue
                      placeholder={
                        hospitals.isPending ? "Loading hospitals…" : "Choose a hospital"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitalOptions.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name} · {hospital.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField
              label="Department"
              error={firstError(errors, "departmentId")}
              description={
                hospitalId.length === 0 ? "Pick a hospital first." : undefined
              }
              required
            >
              {(field) => (
                <Select
                  value={departmentId.length > 0 ? departmentId : undefined}
                  onValueChange={handleDepartmentChange}
                  disabled={hospitalId.length === 0 || departments.isPending}
                >
                  <SelectTrigger {...field}>
                    <SelectValue
                      placeholder={
                        departments.isPending && hospitalId.length > 0
                          ? "Loading departments…"
                          : "Choose a department"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField
              label="Doctor"
              description="Optional. Only doctors currently on duty are listed."
              error={firstError(errors, "doctorId")}
            >
              {(field) => (
                <Select
                  value={doctorId}
                  onValueChange={setDoctorId}
                  disabled={departmentId.length === 0 || doctors.isPending}
                >
                  <SelectTrigger {...field}>
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PREFERENCE}>No preference</SelectItem>
                    {doctorOptions.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} · {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField label="Date" error={firstError(errors, "scheduledFor")} required>
              {(field) => (
                <DateInput
                  {...field}
                  min={todayInputValue()}
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setTime("");
                  }}
                />
              )}
            </FormField>

            <fieldset className="grid gap-3">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span>Select 1-Hour Time Slot</span>
                  <span className="text-destructive">*</span>
                </legend>
                {time.length > 0 ? (
                  <span className="text-xs font-semibold text-primary">
                    Selected: {formatTime12h(time)}
                  </span>
                ) : null}
              </div>

              {hospitalId.length === 0 || departmentId.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Select a hospital and department first to view available time slots.
                </div>
              ) : slotsQuery.isPending ? (
                <div className="rounded-lg border border-border p-4 text-center text-xs text-muted-foreground animate-pulse">
                  Loading available time slots…
                </div>
              ) : slotsQuery.data && slotsQuery.data.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {slotsQuery.data.map((slot) => {
                    const isSelected = time === slot.slotStart;
                    const startTimeLabel = formatTime12h(slot.slotStart);
                    const endTimeLabel = formatTime12h(slot.slotEnd);
                    const isPast = !!slot.isPast;
                    const isFull = slot.isFull && !isPast;
                    const isDisabled = isPast || isFull;

                    return (
                      <button
                        key={slot.slotStart}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setTime(isSelected ? "" : slot.slotStart)}
                        className={`group relative flex flex-col items-center justify-center min-h-[5.5rem] py-4 px-3 rounded-xl border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02] ring-2 ring-primary"
                            : isDisabled
                              ? "border-border/40 bg-muted/30 text-muted-foreground/60 opacity-50 cursor-not-allowed"
                              : "border-border bg-card/80 text-card-foreground hover:border-primary/60 hover:bg-card hover:shadow-sm"
                        }`}
                      >
                        <span className="text-xs font-bold tracking-tight">
                          {startTimeLabel} – {endTimeLabel}
                        </span>

                        <div className="mt-2">
                          {isPast ? (
                            <span className="inline-block rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              UNAVAILABLE
                            </span>
                          ) : isFull ? (
                            <span className="inline-block rounded-full bg-destructive/15 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                              FULL
                            </span>
                          ) : isSelected ? (
                            <span className="inline-block rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              ✓ Selected
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {slot.availableCount} of {slot.capacity} left
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-border p-4 text-center text-xs text-muted-foreground">
                  No time slots available for the selected date.
                </div>
              )}
            </fieldset>

            <FormField
              label="Reason for the visit"
              description="A sentence is enough — it helps the department prepare."
              error={firstError(errors, "reason")}
              required
            >
              {(field) => (
                <Textarea
                  {...field}
                  rows={3}
                  maxLength={300}
                  placeholder="Follow-up on my ECG report"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              )}
            </FormField>

            {selectedDepartment !== undefined ? (
              <Alert variant="info">
                <Info aria-hidden />
                <AlertTitle>
                  {selectedDepartment.name} sees a patient about every{" "}
                  {selectedDepartment.avgConsultMinutes} minutes
                </AlertTitle>
                <AlertDescription>
                  Your estimated wait is worked out from that, and updates live once you
                  are in the queue.
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
              {submitting ? "Booking your visit" : "Confirm booking"}
              {submitting ? null : <CalendarCheck aria-hidden />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
