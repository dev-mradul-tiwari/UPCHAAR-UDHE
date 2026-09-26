import type {
  BedInventory,
  MedicalHistory as MedicalHistoryRow,
  MedicineInventory,
  Patient,
} from "@upchaar/db";
import type {
  Appointment,
  BedSummary,
  Department,
  Doctor,
  HospitalDetail,
  HospitalSummary,
  MedicalHistory,
  Medicine,
  PatientProfile,
  PatientRecord,
  QueueEntry,
} from "@upchaar/types";

import type {
  AppointmentWithRelations,
  DepartmentWithRelations,
  DoctorWithRelations,
  HospitalWithDetail,
  HospitalWithSummary,
  PatientWithHistory,
} from "../lib/db.js";
import { toIso, toIsoOrNull } from "./dates.js";

/* -------------------------------------------------------------- patients */

export function toPatientProfile(patient: Patient): PatientProfile {
  return {
    id: patient.id,
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: toIso(patient.dateOfBirth),
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    createdAt: toIso(patient.createdAt),
  };
}

export function toMedicalHistory(history: MedicalHistoryRow): MedicalHistory {
  return {
    id: history.id,
    patientId: history.patientId,
    chronicDiseases: history.chronicDiseases,
    allergies: history.allergies,
    pastSurgeries: history.pastSurgeries,
    currentMedications: history.currentMedications,
    smoking: history.smoking,
    alcohol: history.alcohol,
    notes: history.notes,
    updatedAt: toIso(history.updatedAt),
  };
}

export function toPatientRecord(patient: PatientWithHistory): PatientRecord {
  return {
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: toIso(patient.dateOfBirth),
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
    },
    medicalHistory: patient.medicalHistory ? toMedicalHistory(patient.medicalHistory) : null,
  };
}

/* --------------------------------------------------------------- doctors */

export function toDoctor(doctor: DoctorWithRelations): Doctor {
  return {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    specialization: doctor.specialization,
    experienceYears: doctor.experienceYears,
    rating: (doctor as any).rating ?? 4.0,
    isAvailable: doctor.isAvailable,
    mustChangePassword: doctor.mustChangePassword,
    hospitalId: doctor.hospitalId,
    hospitalName: doctor.hospital?.name ?? null,
    departmentId: doctor.departmentId,
    departmentName: doctor.department?.name ?? null,
  };
}

/* ----------------------------------------------------------- departments */

export function toDepartment(department: DepartmentWithRelations): Department {
  return {
    id: department.id,
    name: department.name,
    description: department.description,
    avgConsultMinutes: department.avgConsultMinutes,
    hospitalId: department.hospitalId,
    headDoctor: department.headDoctor
      ? { id: department.headDoctor.id, name: department.headDoctor.name }
      : null,
    doctorCount: department._count.doctors,
  };
}

/* ------------------------------------------------------------------ beds */

export function toBedSummaries(beds: BedInventory[]): BedSummary[] {
  return beds.map((bed) => ({ type: bed.type, total: bed.total, available: bed.available }));
}

export function sumBeds(beds: BedInventory[]): { total: number; available: number } {
  return beds.reduce(
    (acc, bed) => ({ total: acc.total + bed.total, available: acc.available + bed.available }),
    { total: 0, available: 0 },
  );
}

/* ------------------------------------------------------------- hospitals */

export function toHospitalSummary(hospital: HospitalWithSummary): HospitalSummary {
  const beds = toBedSummaries(hospital.beds);
  const totals = sumBeds(hospital.beds);
  return {
    id: hospital.id,
    name: hospital.name,
    type: hospital.type,
    city: hospital.city,
    state: hospital.state,
    addressLine: hospital.addressLine,
    zipcode: hospital.zipcode,
    phone: hospital.phone,
    rating: hospital.rating,
    departmentCount: hospital._count.departments,
    doctorCount: hospital._count.doctors,
    beds,
    totalBeds: totals.total,
    availableBeds: totals.available,
  };
}

export function toHospitalDetail(hospital: HospitalWithDetail): HospitalDetail {
  const summary = toHospitalSummary({
    ...hospital,
    beds: hospital.beds,
    _count: hospital._count,
  });

  return {
    ...summary,
    email: hospital.email,
    registrationNumber: hospital.registrationNumber,
    departments: hospital.departments.map((department) => ({
      id: department.id,
      name: department.name,
      description: department.description,
      avgConsultMinutes: department.avgConsultMinutes,
      doctorCount: department._count.doctors,
      headDoctor: department.headDoctor
        ? { id: department.headDoctor.id, name: department.headDoctor.name }
        : null,
    })),
    doctors: hospital.doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.specialization,
      experienceYears: doctor.experienceYears,
      rating: (doctor as any).rating ?? 4.0,
      isAvailable: doctor.isAvailable,
      departmentId: doctor.departmentId,
      departmentName: doctor.department?.name ?? null,
    })),
  };
}

/* ---------------------------------------------------------- appointments */

export function toAppointment(appointment: AppointmentWithRelations): Appointment {
  return {
    id: appointment.id,
    reason: appointment.reason,
    status: appointment.status,
    type: appointment.type,
    scheduledFor: toIso(appointment.scheduledFor),
    queueNumber: appointment.queueNumber,
    notes: appointment.notes,
    receiveSms: appointment.receiveSms,
    startedAt: toIsoOrNull(appointment.startedAt),
    completedAt: toIsoOrNull(appointment.completedAt),
    createdAt: toIso(appointment.createdAt),
    patient: appointment.patient
      ? {
          id: appointment.patient.id,
          name: appointment.patient.name,
          phone: appointment.patient.phone,
        }
      : null,
    hospital: appointment.hospital
      ? {
          id: appointment.hospital.id,
          name: appointment.hospital.name,
          city: appointment.hospital.city,
        }
      : null,
    department: appointment.department
      ? { id: appointment.department.id, name: appointment.department.name }
      : null,
    doctor: appointment.doctor
      ? {
          id: appointment.doctor.id,
          name: appointment.doctor.name,
          specialization: appointment.doctor.specialization,
        }
      : null,
  };
}

export function toQueueEntry(appointment: AppointmentWithRelations): QueueEntry {
  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    queueNumber: appointment.queueNumber,
    status: appointment.status,
    patientName: appointment.patient?.name ?? "Unknown patient",
    reason: appointment.reason,
    scheduledFor: toIso(appointment.scheduledFor),
  };
}

/* ------------------------------------------------------------- inventory */

export function toMedicine(medicine: MedicineInventory, now = new Date()): Medicine {
  const msPerDay = 24 * 60 * 60 * 1000;
  return {
    id: medicine.id,
    name: medicine.name,
    quantity: medicine.quantity,
    threshold: medicine.threshold,
    unit: medicine.unit,
    expiryDate: toIso(medicine.expiryDate),
    isLowStock: medicine.quantity <= medicine.threshold,
    daysToExpiry: Math.ceil((medicine.expiryDate.getTime() - now.getTime()) / msPerDay),
  };
}
