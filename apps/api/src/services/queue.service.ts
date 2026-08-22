import type {
  Appointment,
  AppointmentStatus,
  BookAppointmentInput,
  DepartmentQueue,
  QueueStatus,
  SlotAvailability,
} from "@upchaar/types";

import { bus } from "../lib/events.js";
import {
  appointmentInclude,
  isPrismaKnownError,
  prisma,
  type AppointmentWithRelations,
} from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { startOfUtcDay, todayUtc } from "../utils/dates.js";
import { logger } from "../utils/logger.js";
import { toAppointment, toQueueEntry } from "../utils/serializers.js";

/** Statuses that occupy a slot in the live queue (see docs/ARCHITECTURE.md). */
const ACTIVE_QUEUE_STATUSES: AppointmentStatus[] = ["CONFIRMED", "IN_PROGRESS"];
/** Statuses shown in a department console — includes not-yet-confirmed bookings. */
const VISIBLE_QUEUE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

const MAX_QUEUE_ALLOCATION_ATTEMPTS = 5;

export function publishAppointmentChange(
  appointment: AppointmentWithRelations,
  reason: "created" | "status" | "assigned" | "cancelled",
): void {
  bus.publishAppointmentChanged({
    appointmentId: appointment.id,
    hospitalId: appointment.hospitalId,
    departmentId: appointment.departmentId,
    patientId: appointment.patientId,
    scheduledDay: appointment.scheduledDay.toISOString(),
    reason,
  });
}

/* ----------------------------------------------------------------- slots */

export async function getAvailableSlots(
  hospitalId: string,
  departmentId: string,
  dateStr: string,
): Promise<SlotAvailability[]> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, hospitalId: true, avgConsultMinutes: true },
  });
  if (!department) throw ApiError.notFound("Department not found");
  if (department.hospitalId !== hospitalId) {
    throw ApiError.badRequest("That department does not belong to the selected hospital");
  }

  const avgMinutes = Math.max(1, department.avgConsultMinutes);
  const capacity = Math.max(1, Math.floor(60 / avgMinutes));

  const targetDate = new Date(dateStr);
  const dayStart = startOfUtcDay(targetDate);

  const now = new Date();
  const slots: SlotAvailability[] = [];

  for (let hour = 8; hour < 24; hour += 1) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const startStr = `${pad(hour)}:00`;
    const endStr = `${pad(hour + 1)}:00`;

    const slotStart = new Date(`${dateStr}T${startStr}:00`);
    const slotEnd = new Date(`${dateStr}T${endStr}:00`);

    const bookedCount = await prisma.appointment.count({
      where: {
        hospitalId,
        departmentId,
        scheduledDay: dayStart,
        status: { not: "CANCELLED" },
        scheduledFor: {
          gte: slotStart,
          lt: slotEnd,
        },
      },
    });

    const isPast = !Number.isNaN(slotEnd.getTime()) && now >= slotEnd;
    const isFull = bookedCount >= capacity;
    const availableCount = Math.max(0, capacity - bookedCount);

    slots.push({
      slotStart: startStr,
      slotEnd: endStr,
      startTimeIso: slotStart.toISOString(),
      capacity,
      bookedCount,
      availableCount,
      isFull,
      isPast,
    });
  }

  return slots;
}

/* ------------------------------------------------------------------ book */

export async function bookAppointment(
  patientId: string,
  input: BookAppointmentInput,
): Promise<Appointment> {
  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
    select: { id: true, hospitalId: true, avgConsultMinutes: true },
  });
  if (!department) throw ApiError.notFound("Department not found");
  if (department.hospitalId !== input.hospitalId) {
    throw ApiError.badRequest("That department does not belong to the selected hospital");
  }

  if (input.doctorId) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: input.doctorId },
      select: { id: true, hospitalId: true, isAvailable: true },
    });
    if (!doctor) throw ApiError.notFound("Doctor not found");
    if (doctor.hospitalId !== input.hospitalId) {
      throw ApiError.badRequest("That doctor does not work at the selected hospital");
    }
    if (!doctor.isAvailable) throw ApiError.conflict("That doctor is currently off duty");
  }

  const scheduledFor = input.scheduledFor;
  const scheduledDay = startOfUtcDay(scheduledFor);

  // Check 1-hour slot capacity
  const slotStart = new Date(scheduledFor);
  slotStart.setUTCMinutes(0, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setUTCHours(slotEnd.getUTCHours() + 1);

  const avgMinutes = Math.max(1, department.avgConsultMinutes);
  const capacity = Math.max(1, Math.floor(60 / avgMinutes));

  const bookedInSlot = await prisma.appointment.count({
    where: {
      hospitalId: input.hospitalId,
      departmentId: input.departmentId,
      scheduledDay,
      status: { not: "CANCELLED" },
      scheduledFor: {
        gte: slotStart,
        lt: slotEnd,
      },
    },
  });

  if (Date.now() >= slotEnd.getTime()) {
    throw ApiError.badRequest("That time slot has already ended. Please select an upcoming slot.");
  }

  if (bookedInSlot >= capacity) {
    throw ApiError.conflict("That time slot is fully booked. Please select another slot.");
  }

  for (let attempt = 1; attempt <= MAX_QUEUE_ALLOCATION_ATTEMPTS; attempt += 1) {
    try {
      const appointment = await prisma.$transaction(async (tx) => {
        const highest = await tx.appointment.aggregate({
          where: {
            hospitalId: input.hospitalId,
            departmentId: input.departmentId,
            scheduledFor: {
              gte: slotStart,
              lt: slotEnd,
            },
          },
          _max: { queueNumber: true },
        });

        const queueNumber = (highest._max.queueNumber ?? 0) + 1;

        return tx.appointment.create({
          data: {
            patientId,
            hospitalId: input.hospitalId,
            departmentId: input.departmentId,
            doctorId: input.doctorId ?? null,
            reason: input.reason,
            scheduledFor,
            scheduledDay,
            queueNumber,
          },
          include: appointmentInclude,
        });
      });

      publishAppointmentChange(appointment, "created");
      return toAppointment(appointment);
    } catch (error) {
      if (isPrismaKnownError(error, "P2002") && attempt < MAX_QUEUE_ALLOCATION_ATTEMPTS) {
        logger.warn("queue number collision, retrying", {
          attempt,
          departmentId: input.departmentId,
        });
        continue;
      }
      throw error;
    }
  }

  throw ApiError.conflict("The queue is busy right now — please try again");
}

/* ---------------------------------------------------------------- status */

type QueueBucket = { hospitalId: string; departmentId: string; scheduledDay: Date };

async function countPeopleAhead(
  bucket: QueueBucket,
  appointment: { scheduledFor: Date; queueNumber: number },
): Promise<number> {
  return prisma.appointment.count({
    where: {
      hospitalId: bucket.hospitalId,
      departmentId: bucket.departmentId,
      scheduledDay: bucket.scheduledDay,
      status: { in: ACTIVE_QUEUE_STATUSES },
      OR: [
        { scheduledFor: { lt: appointment.scheduledFor } },
        {
          scheduledFor: appointment.scheduledFor,
          queueNumber: { lt: appointment.queueNumber },
        },
      ],
    },
  });
}

async function findNowServing(bucket: QueueBucket): Promise<number | null> {
  const current = await prisma.appointment.findFirst({
    where: {
      hospitalId: bucket.hospitalId,
      departmentId: bucket.departmentId,
      scheduledDay: bucket.scheduledDay,
      status: "IN_PROGRESS",
    },
    orderBy: [{ scheduledFor: "asc" }, { queueNumber: "asc" }],
    select: { queueNumber: true },
  });
  return current?.queueNumber ?? null;
}

export async function getQueueStatus(appointmentId: string): Promise<QueueStatus> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { department: { select: { id: true, name: true, avgConsultMinutes: true } } },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");

  const bucket: QueueBucket = {
    hospitalId: appointment.hospitalId,
    departmentId: appointment.departmentId,
    scheduledDay: appointment.scheduledDay,
  };

  const nowServing = await findNowServing(bucket);

  // If status is PENDING, position & estimatedWaitMinutes are null (awaiting hospital confirmation)
  if (appointment.status === "PENDING") {
    return {
      appointmentId: appointment.id,
      status: appointment.status,
      queueNumber: appointment.queueNumber,
      position: null,
      peopleAhead: null,
      estimatedWaitMinutes: null,
      nowServing,
      departmentId: appointment.departmentId,
      departmentName: appointment.department.name,
    };
  }

  const isWaiting = VISIBLE_QUEUE_STATUSES.includes(appointment.status);
  if (!isWaiting) {
    return {
      appointmentId: appointment.id,
      status: appointment.status,
      queueNumber: appointment.queueNumber,
      position: null,
      peopleAhead: null,
      estimatedWaitMinutes: null,
      nowServing,
      departmentId: appointment.departmentId,
      departmentName: appointment.department.name,
    };
  }

  const peopleAhead = await countPeopleAhead(bucket, {
    scheduledFor: appointment.scheduledFor,
    queueNumber: appointment.queueNumber,
  });

  const now = new Date();
  const slotStartTime = new Date(appointment.scheduledFor);
  const timeUntilSlotStart = Math.max(0, Math.floor((slotStartTime.getTime() - now.getTime()) / 60_000));
  const estimatedWaitMinutes = timeUntilSlotStart + (peopleAhead * appointment.department.avgConsultMinutes);

  return {
    appointmentId: appointment.id,
    status: appointment.status,
    queueNumber: appointment.queueNumber,
    position: peopleAhead + 1,
    peopleAhead,
    estimatedWaitMinutes,
    nowServing,
    departmentId: appointment.departmentId,
    departmentName: appointment.department.name,
  };
}

/* ------------------------------------------------------------ department */

export async function getDepartmentQueue(
  departmentId: string,
  day: Date = todayUtc(),
): Promise<DepartmentQueue> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, name: true, hospitalId: true, avgConsultMinutes: true },
  });
  if (!department) throw ApiError.notFound("Department not found");

  const appointments = await prisma.appointment.findMany({
    where: {
      hospitalId: department.hospitalId,
      departmentId: department.id,
      scheduledDay: day,
      status: { in: VISIBLE_QUEUE_STATUSES },
    },
    orderBy: [{ scheduledFor: "asc" }, { queueNumber: "asc" }],
    include: appointmentInclude,
  });

  const inProgress = appointments.find((appointment) => appointment.status === "IN_PROGRESS");

  return {
    departmentId: department.id,
    departmentName: department.name,
    avgConsultMinutes: department.avgConsultMinutes,
    nowServing: inProgress?.queueNumber ?? null,
    entries: appointments.map(toQueueEntry),
  };
}

/* ------------------------------------------------------------- call next */

export type CallNextResult = {
  completed: Appointment | null;
  nowServing: Appointment | null;
  queue: DepartmentQueue;
};

export async function callNext(departmentId: string, doctorId: string): Promise<CallNextResult> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, hospitalId: true },
  });
  if (!department) throw ApiError.notFound("Department not found");

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, hospitalId: true },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  if (doctor.hospitalId !== department.hospitalId) {
    throw ApiError.forbidden("That department belongs to another hospital");
  }

  const day = todayUtc();
  const bucket = {
    hospitalId: department.hospitalId,
    departmentId: department.id,
    scheduledDay: day,
  };

  const { completed, promoted } = await prisma.$transaction(async (tx) => {
    const current = await tx.appointment.findFirst({
      where: { ...bucket, status: "IN_PROGRESS" },
      orderBy: [{ scheduledFor: "asc" }, { queueNumber: "asc" }],
    });

    const finished = current
      ? await tx.appointment.update({
          where: { id: current.id },
          data: { status: "COMPLETED", completedAt: new Date() },
          include: appointmentInclude,
        })
      : null;

    const next = await tx.appointment.findFirst({
      where: { ...bucket, status: "CONFIRMED" },
      orderBy: [{ scheduledFor: "asc" }, { queueNumber: "asc" }],
    });

    const started = next
      ? await tx.appointment.update({
          where: { id: next.id },
          data: {
            status: "IN_PROGRESS",
            startedAt: new Date(),
            ...(next.doctorId ? {} : { doctorId }),
          },
          include: appointmentInclude,
        })
      : null;

    return { completed: finished, promoted: started };
  });

  if (completed) publishAppointmentChange(completed, "status");
  if (promoted) publishAppointmentChange(promoted, "status");

  return {
    completed: completed ? toAppointment(completed) : null,
    nowServing: promoted ? toAppointment(promoted) : null,
    queue: await getDepartmentQueue(department.id, day),
  };
}
