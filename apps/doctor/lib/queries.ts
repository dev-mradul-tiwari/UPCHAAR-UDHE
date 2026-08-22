"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  Appointment,
  AppointmentStatus,
  DepartmentQueue,
  DoctorStats,
  Paginated,
  PatientRecord,
} from "@upchaar/types";

import { api, type AppointmentListParams } from "./api";

/** Every cache key in the app, in one place. */
export const queryKeys = {
  stats: () => ["doctor", "stats"] as const,
  appointments: (status: AppointmentStatus | "ALL", date: string | undefined, page: number) =>
    ["appointments", status, date, page] as const,
  appointment: (id: string) => ["appointment", id] as const,
  queue: (departmentId: string) => ["queue", departmentId] as const,
  records: (patientId: string) => ["records", patientId] as const,
} as const;

export function useDoctorStats(): UseQueryResult<DoctorStats, Error> {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: () => api.doctors.stats(),
    staleTime: 30_000,
  });
}

export function useAppointments(
  params: AppointmentListParams,
  page: number = 1,
): UseQueryResult<Paginated<Appointment>, Error> {
  return useQuery({
    queryKey: queryKeys.appointments(
      params.status ?? "ALL",
      params.date,
      page,
    ),
    queryFn: () => api.appointments.list({ ...params, page }),
    placeholderData: (previous) => previous,
  });
}

export function useAppointment(id: string): UseQueryResult<Appointment, Error> {
  return useQuery({
    queryKey: queryKeys.appointment(id),
    queryFn: () => api.appointments.get(id),
  });
}

export function useDepartmentQueue(
  departmentId: string | null,
): UseQueryResult<DepartmentQueue, Error> {
  return useQuery({
    queryKey: queryKeys.queue(departmentId ?? ""),
    queryFn: () => api.queue.forDepartment(departmentId!),
    enabled: departmentId !== null,
    refetchInterval: 10_000,
  });
}

export function usePatientRecord(patientId: string): UseQueryResult<PatientRecord, Error> {
  return useQuery({
    queryKey: queryKeys.records(patientId),
    queryFn: () => api.records.forPatient(patientId),
  });
}
