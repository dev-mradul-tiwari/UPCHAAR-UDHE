import type {
  Doctor,
  DoctorCreateInput,
  DoctorProvisioned,
  DoctorSelfUpdateInput,
  DoctorStats,
  DoctorUpdateInput,
} from "@upchaar/types";

import { Prisma, doctorInclude, prisma } from "../lib/db.js";
import { generateTempPassword, hashPassword } from "../lib/password.js";
import { ApiError } from "../utils/api-error.js";
import { todayUtc } from "../utils/dates.js";
import { toDoctor } from "../utils/serializers.js";

const DEFAULT_CONSULT_MINUTES = 15;

async function assertDepartmentBelongsToHospital(
  departmentId: string,
  hospitalId: string,
): Promise<void> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { hospitalId: true },
  });
  if (!department) throw ApiError.notFound("Department not found");
  if (department.hospitalId !== hospitalId) {
    throw ApiError.forbidden("That department belongs to another hospital");
  }
}

async function assertOwnedDoctor(doctorId: string, hospitalId: string): Promise<void> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { hospitalId: true },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  if (doctor.hospitalId !== hospitalId) {
    throw ApiError.forbidden("That doctor works at another hospital");
  }
}

export async function listDoctors(filters: {
  hospitalId?: string;
  departmentId?: string;
}): Promise<Doctor[]> {
  const where: Prisma.DoctorWhereInput = {};
  if (filters.hospitalId) where.hospitalId = filters.hospitalId;
  if (filters.departmentId) where.departmentId = filters.departmentId;

  const doctors = await prisma.doctor.findMany({
    where,
    include: doctorInclude,
    orderBy: { name: "asc" },
  });
  return doctors.map(toDoctor);
}

export async function getDoctor(doctorId: string): Promise<Doctor> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: doctorInclude,
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  return toDoctor(doctor);
}

/** Hospital-provisioned account. The temp password is returned exactly once. */
export async function createDoctor(
  hospitalId: string,
  input: DoctorCreateInput,
): Promise<DoctorProvisioned> {
  if (input.departmentId) await assertDepartmentBelongsToHospital(input.departmentId, hospitalId);

  const existing = await prisma.doctor.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict("Email already registered");

  const tempPassword = generateTempPassword();

  const doctor = await prisma.doctor.create({
    data: {
      hospitalId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      specialization: input.specialization,
      experienceYears: input.experienceYears,
      departmentId: input.departmentId ?? null,
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
    },
    include: doctorInclude,
  });

  return { doctor: toDoctor(doctor), tempPassword };
}

export async function updateDoctor(
  hospitalId: string,
  doctorId: string,
  input: DoctorUpdateInput,
): Promise<Doctor> {
  await assertOwnedDoctor(doctorId, hospitalId);
  if (input.departmentId) await assertDepartmentBelongsToHospital(input.departmentId, hospitalId);

  const data: Prisma.DoctorUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.specialization !== undefined) data.specialization = input.specialization;
  if (input.experienceYears !== undefined) data.experienceYears = input.experienceYears;
  if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;
  if (input.departmentId !== undefined) {
    data.department = input.departmentId
      ? { connect: { id: input.departmentId } }
      : { disconnect: true };
  }

  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data,
    include: doctorInclude,
  });
  return toDoctor(doctor);
}

export async function deleteDoctor(
  hospitalId: string,
  doctorId: string,
): Promise<{ id: string }> {
  await assertOwnedDoctor(doctorId, hospitalId);
  await prisma.doctor.delete({ where: { id: doctorId } });
  return { id: doctorId };
}

export async function updateOwnProfile(
  doctorId: string,
  input: DoctorSelfUpdateInput,
): Promise<Doctor> {
  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: input,
    include: doctorInclude,
  });
  return toDoctor(doctor);
}

export async function setAvailability(doctorId: string, isAvailable: boolean): Promise<Doctor> {
  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: { isAvailable },
    include: doctorInclude,
  });
  return toDoctor(doctor);
}

export async function getDoctorStats(doctorId: string): Promise<DoctorStats> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      isAvailable: true,
      department: { select: { avgConsultMinutes: true } },
    },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");

  const day = todayUtc();
  const appointments = await prisma.appointment.findMany({
    where: { doctorId, scheduledDay: day },
    select: { status: true },
  });

  return {
    todayTotal: appointments.length,
    seenToday: appointments.filter((a) => a.status === "COMPLETED").length,
    waitingToday: appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED")
      .length,
    avgConsultMinutes: doctor.department?.avgConsultMinutes ?? DEFAULT_CONSULT_MINUTES,
    onDuty: doctor.isAvailable,
  };
}
