import type { MedicalHistoryInput, PatientRecord } from "@upchaar/types";

import { appointmentInclude, patientRecordInclude, prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { toIso } from "../utils/dates.js";
import { toPatientRecord } from "../utils/serializers.js";

export async function getPatientRecord(patientId: string): Promise<PatientRecord> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: patientRecordInclude,
  });
  if (!patient) throw ApiError.notFound("Patient not found");

  const appointmentsWithNotes = await prisma.appointment.findMany({
    where: {
      patientId,
      notes: { not: null },
      status: { not: "CANCELLED" },
    },
    include: appointmentInclude,
    orderBy: { createdAt: "desc" },
  });

  const record = toPatientRecord(patient);
  record.consultations = appointmentsWithNotes.map((apt) => ({
    id: apt.id,
    doctorName: apt.doctor?.name ?? "Attending Doctor",
    doctorDepartment: apt.department?.name ?? apt.doctor?.specialization?.replace(/ surgery$/i, "") ?? null,
    hospitalName: apt.hospital?.name ?? "Upchaar Hospital",
    date: toIso(apt.completedAt ?? apt.scheduledFor),
    notes: apt.notes ?? "",
    reason: apt.reason,
  }));

  return record;
}

export async function upsertOwnRecord(
  patientId: string,
  input: MedicalHistoryInput,
): Promise<PatientRecord> {
  const data = {
    chronicDiseases: input.chronicDiseases,
    allergies: input.allergies,
    pastSurgeries: input.pastSurgeries,
    currentMedications: input.currentMedications,
    smoking: input.smoking,
    alcohol: input.alcohol,
    notes: input.notes ?? null,
  };

  await prisma.medicalHistory.upsert({
    where: { patientId },
    create: { patientId, ...data },
    update: data,
  });

  return getPatientRecord(patientId);
}

/**
 * A doctor may only read a record for a patient they share an appointment
 * with — anything else is a 403.
 */
export async function getPatientRecordForDoctor(
  doctorId: string,
  patientId: string,
): Promise<PatientRecord> {
  const shared = await prisma.appointment.count({
    where: { doctorId, patientId },
  });
  if (shared === 0) {
    throw ApiError.forbidden("You can only view records for patients you are treating");
  }
  return getPatientRecord(patientId);
}
