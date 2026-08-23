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

  const completedAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      status: "COMPLETED",
    },
    include: appointmentInclude,
    orderBy: { completedAt: "desc" },
  });

  const record = toPatientRecord(patient);
  record.consultations = completedAppointments.map((apt) => ({
    id: apt.id,
    doctorName: apt.doctor?.name ?? "Attending Doctor",
    doctorDepartment: apt.department?.name ?? apt.doctor?.specialization?.replace(/ surgery$/i, "") ?? null,
    hospitalName: apt.hospital?.name ?? "Upchaar Hospital",
    date: toIso(apt.completedAt ?? apt.scheduledFor),
    notes: apt.notes ?? null,
    reason: apt.reason,
    status: apt.status,
    scheduledFor: toIso(apt.scheduledFor),
    queueNumber: apt.queueNumber,
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
 * A doctor may read a record for a patient with an appointment at their hospital or assigned to them.
 */
export async function getPatientRecordForDoctor(
  doctorId: string,
  patientId: string,
): Promise<PatientRecord> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { hospitalId: true },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");

  const shared = await prisma.appointment.count({
    where: {
      patientId,
      OR: [
        { doctorId },
        { hospitalId: doctor.hospitalId },
      ],
    },
  });
  if (shared === 0) {
    throw ApiError.forbidden("You can only view records for patients treated at your hospital");
  }
  return getPatientRecord(patientId);
}

export async function updatePatientPhone(
  patientId: string,
  phone: string,
): Promise<PatientRecord> {
  const cleanPhone = phone.trim();
  if (cleanPhone.length < 10) {
    throw ApiError.badRequest("Please enter a valid mobile number.");
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: { phone: cleanPhone },
  });

  return getPatientRecord(patientId);
}
