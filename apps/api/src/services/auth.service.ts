import type {
  Doctor,
  HospitalDetail,
  HospitalRegisterInput,
  LoginInput,
  PatientProfile,
  PatientRegisterInput,
} from "@upchaar/types";

import { signToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  doctorInclude,
  hospitalDetailInclude,
  patientRecordInclude,
  prisma,
} from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { toDoctor, toHospitalDetail, toPatientProfile } from "../utils/serializers.js";

const INVALID_CREDENTIALS = "Email or password is incorrect";

/* -------------------------------------------------------------- patients */

export async function registerPatient(
  input: PatientRegisterInput,
): Promise<{ token: string; patient: PatientProfile }> {
  const existingEmail = input.email
    ? await prisma.patient.findUnique({
        where: { email: input.email },
        select: { id: true },
      })
    : null;
  if (existingEmail) throw ApiError.conflict("Email already registered");

  const existingPhone = await prisma.patient.findUnique({
    where: { phone: input.phone },
    select: { id: true },
  });
  if (existingPhone) throw ApiError.conflict("Phone number already registered");

  const patient = await prisma.patient.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      bloodGroup: input.bloodGroup ?? null,
      medicalHistory: input.medicalHistory
        ? {
            create: {
              chronicDiseases: input.medicalHistory.chronicDiseases,
              allergies: input.medicalHistory.allergies,
              pastSurgeries: input.medicalHistory.pastSurgeries,
              currentMedications: input.medicalHistory.currentMedications,
              smoking: input.medicalHistory.smoking,
              alcohol: input.medicalHistory.alcohol,
              notes: input.medicalHistory.notes ?? null,
            },
          }
        : undefined,
    },
    include: patientRecordInclude,
  });

  return {
    token: signToken({ sub: patient.id, role: "PATIENT" }),
    patient: toPatientProfile(patient),
  };
}

export async function loginPatient(
  input: LoginInput,
): Promise<{ token: string; patient: PatientProfile }> {
  const patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { email: input.email },
        { phone: input.email },
      ],
    },
  });
  if (!patient || !(await verifyPassword(input.password, patient.passwordHash))) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  return {
    token: signToken({ sub: patient.id, role: "PATIENT" }),
    patient: toPatientProfile(patient),
  };
}

/* ------------------------------------------------------------- hospitals */

export async function registerHospital(
  input: HospitalRegisterInput,
): Promise<{ token: string; hospital: HospitalDetail }> {
  const existing = await prisma.hospital.findFirst({
    where: {
      OR: [{ email: input.email }, { registrationNumber: input.registrationNumber }],
    },
    select: { email: true },
  });
  if (existing) {
    throw ApiError.conflict(
      existing.email === input.email
        ? "Email already registered"
        : "Registration number already in use",
    );
  }

  const hospital = await prisma.hospital.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      phone: input.phone,
      type: input.type,
      registrationNumber: input.registrationNumber,
      addressLine: input.addressLine,
      city: input.city,
      state: input.state,
      zipcode: input.zipcode,
    },
    include: hospitalDetailInclude,
  });

  return {
    token: signToken({ sub: hospital.id, role: "HOSPITAL", hospitalId: hospital.id }),
    hospital: toHospitalDetail(hospital),
  };
}

export async function loginHospital(
  input: LoginInput,
): Promise<{ token: string; hospital: HospitalDetail }> {
  const hospital = await prisma.hospital.findUnique({
    where: { email: input.email },
    include: hospitalDetailInclude,
  });
  if (!hospital || !(await verifyPassword(input.password, hospital.passwordHash))) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  return {
    token: signToken({ sub: hospital.id, role: "HOSPITAL", hospitalId: hospital.id }),
    hospital: toHospitalDetail(hospital),
  };
}

/* --------------------------------------------------------------- doctors */

export async function loginDoctor(
  input: LoginInput,
): Promise<{ token: string; doctor: Doctor }> {
  const doctor = await prisma.doctor.findUnique({
    where: { email: input.email },
    include: doctorInclude,
  });
  if (!doctor || !(await verifyPassword(input.password, doctor.passwordHash))) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  return {
    token: signToken({ sub: doctor.id, role: "DOCTOR", hospitalId: doctor.hospitalId }),
    doctor: toDoctor(doctor),
  };
}

export async function changeDoctorPassword(
  doctorId: string,
  currentPassword: string,
  newPassword: string,
): Promise<Doctor> {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  if (!(await verifyPassword(currentPassword, doctor.passwordHash))) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
    include: doctorInclude,
  });

  return toDoctor(updated);
}

/* ------------------------------------------------------------------- me */

export type MeResponse =
  | { role: "PATIENT"; profile: PatientProfile }
  | { role: "DOCTOR"; profile: Doctor }
  | { role: "HOSPITAL"; profile: HospitalDetail };

export async function getMe(role: string, id: string): Promise<MeResponse> {
  if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) throw ApiError.notFound("Account no longer exists");
    return { role: "PATIENT", profile: toPatientProfile(patient) };
  }

  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { id }, include: doctorInclude });
    if (!doctor) throw ApiError.notFound("Account no longer exists");
    return { role: "DOCTOR", profile: toDoctor(doctor) };
  }

  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: hospitalDetailInclude,
  });
  if (!hospital) throw ApiError.notFound("Account no longer exists");
  return { role: "HOSPITAL", profile: toHospitalDetail(hospital) };
}
