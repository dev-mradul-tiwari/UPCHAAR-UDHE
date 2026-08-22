import { ALLOWED_STATUS_TRANSITIONS } from "@upchaar/types";
import type {
  Appointment,
  AppointmentListQuery,
  AppointmentStatusUpdateInput,
  AuthenticatedUser,
  Paginated,
} from "@upchaar/types";

import { Prisma, appointmentInclude, prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { parseDayParam } from "../utils/dates.js";
import { toAppointment } from "../utils/serializers.js";
import { publishAppointmentChange } from "./queue.service.js";

type OwnershipShape = { patientId: string; hospitalId: string; doctorId: string | null };

/**
 * Access control, in one place:
 * - PATIENT  → only their own appointments
 * - DOCTOR   → only appointments at their own hospital
 * - HOSPITAL → only its own appointments
 */
export function assertCanViewAppointment(
  auth: AuthenticatedUser,
  appointment: OwnershipShape,
): void {
  if (auth.role === "PATIENT") {
    if (appointment.patientId !== auth.sub) {
      throw ApiError.forbidden("This appointment belongs to another patient");
    }
    return;
  }

  if (auth.role === "HOSPITAL") {
    if (appointment.hospitalId !== auth.sub) {
      throw ApiError.forbidden("This appointment belongs to another hospital");
    }
    return;
  }

  if (appointment.hospitalId !== auth.hospitalId) {
    throw ApiError.forbidden("This appointment belongs to another hospital");
  }
}

function scopeFilter(auth: AuthenticatedUser): Prisma.AppointmentWhereInput {
  if (auth.role === "PATIENT") return { patientId: auth.sub };
  if (auth.role === "HOSPITAL") return { hospitalId: auth.sub };
  if (!auth.hospitalId) throw ApiError.forbidden("No hospital is associated with this account");
  return { hospitalId: auth.hospitalId };
}

function queryFilter(query: AppointmentListQuery): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.date) where.scheduledDay = parseDayParam(query.date);
  return where;
}

export async function listAppointments(
  auth: AuthenticatedUser,
  query: AppointmentListQuery,
): Promise<Paginated<Appointment>> {
  const where: Prisma.AppointmentWhereInput = {
    ...scopeFilter(auth),
    ...queryFilter(query),
  };

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ scheduledDay: "desc" }, { queueNumber: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    items: rows.map(toAppointment),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getAppointmentForCaller(
  auth: AuthenticatedUser,
  appointmentId: string,
): Promise<Appointment> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");
  assertCanViewAppointment(auth, appointment);
  return toAppointment(appointment);
}

export async function updateAppointmentStatus(
  auth: AuthenticatedUser,
  appointmentId: string,
  input: AppointmentStatusUpdateInput,
): Promise<Appointment> {
  const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!existing) throw ApiError.notFound("Appointment not found");
  assertCanViewAppointment(auth, existing);

  if (existing.status === input.status) {
    if (input.notes !== undefined) {
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { notes: input.notes },
        include: appointmentInclude,
      });
      publishAppointmentChange(updated, "status");
      return toAppointment(updated);
    }
    throw ApiError.conflict(`Appointment is already ${input.status}`);
  }
  if (!ALLOWED_STATUS_TRANSITIONS[existing.status].includes(input.status)) {
    throw ApiError.conflict(`Cannot move an appointment from ${existing.status} to ${input.status}`);
  }

  const data: Prisma.AppointmentUpdateInput = { status: input.status };
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.status === "IN_PROGRESS") data.startedAt = new Date();
  if (input.status === "COMPLETED") data.completedAt = new Date();
  // A doctor starting a consult claims an unassigned appointment.
  if (input.status === "IN_PROGRESS" && !existing.doctorId && auth.role === "DOCTOR") {
    data.doctor = { connect: { id: auth.sub } };
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: appointmentInclude,
  });

  publishAppointmentChange(updated, "status");
  return toAppointment(updated);
}

export async function assignDoctor(
  hospitalId: string,
  appointmentId: string,
  doctorId: string,
): Promise<Appointment> {
  const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!existing) throw ApiError.notFound("Appointment not found");
  if (existing.hospitalId !== hospitalId) {
    throw ApiError.forbidden("This appointment belongs to another hospital");
  }
  if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
    throw ApiError.conflict(`Cannot reassign a ${existing.status} appointment`);
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, hospitalId: true },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  if (doctor.hospitalId !== hospitalId) {
    throw ApiError.forbidden("That doctor works at another hospital");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { doctorId },
    include: appointmentInclude,
  });

  publishAppointmentChange(updated, "assigned");
  return toAppointment(updated);
}

export async function cancelOwnAppointment(
  patientId: string,
  appointmentId: string,
): Promise<Appointment> {
  const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!existing) throw ApiError.notFound("Appointment not found");
  if (existing.patientId !== patientId) {
    throw ApiError.forbidden("This appointment belongs to another patient");
  }
  if (!ALLOWED_STATUS_TRANSITIONS[existing.status].includes("CANCELLED")) {
    throw ApiError.conflict(`A ${existing.status} appointment can no longer be cancelled`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: appointmentInclude,
  });

  publishAppointmentChange(updated, "cancelled");
  return toAppointment(updated);
}
