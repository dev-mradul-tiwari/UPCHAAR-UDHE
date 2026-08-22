import type { Department, DepartmentInput, DepartmentUpdateInput } from "@upchaar/types";

import { Prisma, departmentInclude, prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { toDepartment } from "../utils/serializers.js";

async function assertDoctorBelongsToHospital(
  doctorId: string,
  hospitalId: string,
): Promise<void> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { hospitalId: true },
  });
  if (!doctor) throw ApiError.notFound("Head doctor not found");
  if (doctor.hospitalId !== hospitalId) {
    throw ApiError.forbidden("That doctor works at another hospital");
  }
}

/** Throws 403/404 unless the department belongs to the calling hospital. */
export async function assertOwnedDepartment(
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

export async function listDepartments(hospitalId?: string): Promise<Department[]> {
  const where: Prisma.DepartmentWhereInput = hospitalId ? { hospitalId } : {};
  const departments = await prisma.department.findMany({
    where,
    include: departmentInclude,
    orderBy: { name: "asc" },
  });
  return departments.map(toDepartment);
}

export async function createDepartment(
  hospitalId: string,
  input: DepartmentInput,
): Promise<Department> {
  if (input.headDoctorId) await assertDoctorBelongsToHospital(input.headDoctorId, hospitalId);

  const department = await prisma.department.create({
    data: {
      hospitalId,
      name: input.name,
      description: input.description ?? null,
      headDoctorId: input.headDoctorId ?? null,
      avgConsultMinutes: input.avgConsultMinutes,
    },
    include: departmentInclude,
  });
  return toDepartment(department);
}

export async function updateDepartment(
  hospitalId: string,
  departmentId: string,
  input: DepartmentUpdateInput,
): Promise<Department> {
  await assertOwnedDepartment(departmentId, hospitalId);
  if (input.headDoctorId) await assertDoctorBelongsToHospital(input.headDoctorId, hospitalId);

  const data: Prisma.DepartmentUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.avgConsultMinutes !== undefined) data.avgConsultMinutes = input.avgConsultMinutes;
  if (input.headDoctorId !== undefined) {
    data.headDoctor = input.headDoctorId
      ? { connect: { id: input.headDoctorId } }
      : { disconnect: true };
  }

  const department = await prisma.department.update({
    where: { id: departmentId },
    data,
    include: departmentInclude,
  });
  return toDepartment(department);
}

export async function deleteDepartment(
  hospitalId: string,
  departmentId: string,
): Promise<{ id: string }> {
  await assertOwnedDepartment(departmentId, hospitalId);

  const activeAppointments = await prisma.appointment.count({
    where: {
      departmentId,
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    },
  });
  if (activeAppointments > 0) {
    throw ApiError.conflict("Cancel or complete this department's appointments first");
  }

  await prisma.department.delete({ where: { id: departmentId } });
  return { id: departmentId };
}
