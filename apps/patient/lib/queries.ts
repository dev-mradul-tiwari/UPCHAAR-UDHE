"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  Appointment,
  AppointmentStatus,
  Department,
  Doctor,
  HospitalDetail,
  HospitalSummary,
  Paginated,
  PatientRecord,
  QueueStatus,
  SlotAvailability,
} from "@upchaar/types";

import { api, type HospitalSearchParams } from "./api";

/** Every cache key in the app, in one place. */
export const queryKeys = {
  hospitals: (params: HospitalSearchParams) => ["hospitals", params] as const,
  hospital: (id: string) => ["hospital", id] as const,
  departments: (hospitalId: string | undefined) =>
    ["departments", hospitalId ?? "all"] as const,
  doctors: (hospitalId: string | undefined, departmentId: string | undefined) =>
    ["doctors", hospitalId ?? "all", departmentId ?? "all"] as const,
  appointments: (status: AppointmentStatus | "ALL", page: number) =>
    ["appointments", "mine", status, page] as const,
  appointment: (id: string) => ["appointment", id] as const,
  queue: (appointmentId: string) => ["queue", appointmentId] as const,
  slots: (hospitalId?: string, departmentId?: string, date?: string) =>
    ["slots", hospitalId, departmentId, date] as const,
  records: () => ["records", "me"] as const,
} as const;

export function useHospitals(
  params: HospitalSearchParams,
): UseQueryResult<Paginated<HospitalSummary>, Error> {
  return useQuery({
    queryKey: queryKeys.hospitals(params),
    queryFn: ({ signal }) => api.hospitals.search(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useHospital(id: string): UseQueryResult<HospitalDetail, Error> {
  return useQuery({
    queryKey: queryKeys.hospital(id),
    queryFn: () => api.hospitals.get(id),
  });
}

export function useDepartments(
  hospitalId?: string,
): UseQueryResult<Department[], Error> {
  return useQuery({
    queryKey: queryKeys.departments(hospitalId),
    queryFn: () => api.departments.list(hospitalId),
    staleTime: 5 * 60_000,
  });
}

export function useDoctors(
  hospitalId: string | undefined,
  departmentId: string | undefined,
): UseQueryResult<Doctor[], Error> {
  return useQuery({
    queryKey: queryKeys.doctors(hospitalId, departmentId),
    queryFn: () => api.doctors.list({ hospitalId, departmentId }),
    enabled: hospitalId !== undefined && hospitalId.length > 0,
  });
}

export function useMyAppointments(
  status: AppointmentStatus | "ALL",
  page: number,
  limit = 10,
): UseQueryResult<Paginated<Appointment>, Error> {
  return useQuery({
    queryKey: queryKeys.appointments(status, page),
    queryFn: () =>
      api.appointments.mine({
        ...(status === "ALL" ? {} : { status }),
        page,
        limit,
      }),
    placeholderData: (previous) => previous,
  });
}

export function useAppointment(id: string): UseQueryResult<Appointment, Error> {
  return useQuery({
    queryKey: queryKeys.appointment(id),
    queryFn: () => api.appointments.get(id),
  });
}

export function useQueueStatus(
  appointmentId: string,
  enabled = true,
): UseQueryResult<QueueStatus, Error> {
  return useQuery({
    queryKey: queryKeys.queue(appointmentId),
    queryFn: () => api.queue.forAppointment(appointmentId),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useAvailableSlots(
  hospitalId?: string,
  departmentId?: string,
  date?: string,
): UseQueryResult<SlotAvailability[], Error> {
  return useQuery({
    queryKey: queryKeys.slots(hospitalId, departmentId, date),
    queryFn: () => api.queue.slots(hospitalId!, departmentId!, date!),
    enabled: !!hospitalId && !!departmentId && !!date,
    refetchInterval: 5_000,
  });
}

export function useMedicalRecord(): UseQueryResult<PatientRecord, Error> {
  return useQuery({
    queryKey: queryKeys.records(),
    queryFn: () => api.records.mine(),
  });
}
