import type { CreateReferralInput, Referral } from "@upchaar/types";
import { prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { toIso } from "../utils/dates.js";

function calculateAge(dob: Date): number {
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export async function createReferral(
  referringDoctorId: string,
  input: CreateReferralInput,
): Promise<Referral> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: referringDoctorId },
    include: { hospital: true },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
  });
  if (!patient) throw ApiError.notFound("Patient not found");

  const referral = await prisma.referral.create({
    data: {
      patientId: patient.id,
      referringDoctorId: doctor.id,
      referringHospitalId: doctor.hospitalId,
      reason: input.reason,
      targetSpecialization: input.targetSpecialization ?? null,
      status: "OPEN",
    },
    include: {
      patient: true,
      referringDoctor: true,
      referringHospital: true,
      connectedDoctor: true,
      connectedHospital: true,
    },
  });

  return toReferralDto(referral);
}

export async function listReferrals(): Promise<Referral[]> {
  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      patient: true,
      referringDoctor: true,
      referringHospital: true,
      connectedDoctor: true,
      connectedHospital: true,
    },
  });

  return referrals.map(toReferralDto);
}

export async function connectWithReferral(
  referralId: string,
  connecter: { hospitalId: string; doctorId?: string },
): Promise<Referral> {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
  });
  if (!referral) throw ApiError.notFound("Referral not found");

  const updated = await prisma.referral.update({
    where: { id: referralId },
    data: {
      status: "CONNECTED",
      connectedHospitalId: connecter.hospitalId,
      ...(connecter.doctorId ? { connectedDoctorId: connecter.doctorId } : {}),
    },
    include: {
      patient: true,
      referringDoctor: true,
      referringHospital: true,
      connectedDoctor: true,
      connectedHospital: true,
    },
  });

  return toReferralDto(updated);
}

export async function getPatientReferrals(patientId: string): Promise<Referral[]> {
  const referrals = await prisma.referral.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      patient: true,
      referringDoctor: true,
      referringHospital: true,
      connectedDoctor: true,
      connectedHospital: true,
    },
  });

  return referrals.map(toReferralDto);
}

export async function deleteReferral(referralId: string): Promise<{ id: string }> {
  const referral = await prisma.referral.findUnique({ where: { id: referralId } });
  if (!referral) throw ApiError.notFound("Referral not found");

  await prisma.referral.delete({ where: { id: referralId } });
  return { id: referralId };
}

function toReferralDto(ref: any): Referral {
  return {
    id: ref.id,
    patientId: ref.patientId,
    patientName: ref.patient?.name ?? "Patient",
    patientEmail: ref.patient?.email ?? "",
    patientPhone: ref.patient?.phone ?? "",
    patientAge: ref.patient?.dateOfBirth ? calculateAge(ref.patient.dateOfBirth) : undefined,
    patientGender: ref.patient?.gender ?? undefined,
    referringDoctorId: ref.referringDoctorId,
    referringDoctorName: ref.referringDoctor?.name ?? "Doctor",
    referringDoctorSpecialization: ref.referringDoctor?.specialization ?? "General",
    referringHospitalId: ref.referringHospitalId,
    referringHospitalName: ref.referringHospital?.name ?? "Hospital",
    referringHospitalCity: ref.referringHospital?.city ?? "City",
    reason: ref.reason,
    targetSpecialization: ref.targetSpecialization ?? null,
    status: ref.status,
    connectedDoctorId: ref.connectedDoctorId ?? null,
    connectedDoctorName: ref.connectedDoctor?.name ?? null,
    connectedHospitalId: ref.connectedHospitalId ?? null,
    connectedHospitalName: ref.connectedHospital?.name ?? null,
    createdAt: toIso(ref.createdAt),
  };
}
