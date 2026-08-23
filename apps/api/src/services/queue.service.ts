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
import { SmsService } from "./sms.service.js";

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
            receiveSms: input.receiveSms !== false,
            scheduledFor,
            scheduledDay,
            queueNumber,
          },
          include: appointmentInclude,
        });
      });

      publishAppointmentChange(appointment, "created");
      SmsService.sendBookingCreatedSms({
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phone,
        hospitalName: appointment.hospital.name,
        departmentName: appointment.department.name,
        queueNumber: appointment.queueNumber,
        scheduledFor: appointment.scheduledFor,
        receiveSms: appointment.receiveSms,
      }).catch((err) => logger.warn("Failed to send booking created SMS", { err }));

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

export async function countPeopleAhead(
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
  let appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { department: { select: { id: true, name: true, avgConsultMinutes: true } } },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");

  if (
    appointment.status === "PENDING" &&
    new Date(appointment.scheduledFor).getTime() + 60 * 60 * 1000 <= Date.now()
  ) {
    appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "TIMED_OUT" },
      include: { department: { select: { id: true, name: true, avgConsultMinutes: true } } },
    });
  }

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
      scheduledFor: appointment.scheduledFor.toISOString(),
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
      scheduledFor: appointment.scheduledFor.toISOString(),
    };
  }

  const peopleAhead = await countPeopleAhead(bucket, {
    scheduledFor: appointment.scheduledFor,
    queueNumber: appointment.queueNumber,
  });

  if (peopleAhead === 1) {
    checkAndTriggerQueueAlert(appointment.id).catch(() => {});
  }

  const now = new Date();
  const slotStartTime = new Date(appointment.scheduledFor);
  const prevSlotStartTime = slotStartTime.getHours() <= 8
    ? slotStartTime
    : new Date(slotStartTime.getTime() - 60 * 60 * 1000);

  const queueStarted = now >= prevSlotStartTime || nowServing !== null;

  let estimatedWaitMinutes: number | null = null;
  if (queueStarted) {
    const timeUntilSlotStart = Math.max(0, Math.floor((slotStartTime.getTime() - now.getTime()) / 60_000));
    estimatedWaitMinutes = timeUntilSlotStart + (peopleAhead * appointment.department.avgConsultMinutes);
  }

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
    scheduledFor: appointment.scheduledFor.toISOString(),
  };
}

const sentQueueAlerts = new Set<string>();

export function markQueueAlertSent(appointmentId: string): void {
  sentQueueAlerts.add(appointmentId);
}

export async function checkAndTriggerQueueAlert(appointmentId: string): Promise<void> {
  if (sentQueueAlerts.has(appointmentId)) return;

  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { name: true, phone: true } },
        hospital: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!appt || appt.status !== "CONFIRMED" || appt.receiveSms === false) return;

    const bucket = {
      hospitalId: appt.hospitalId,
      departmentId: appt.departmentId,
      scheduledDay: appt.scheduledDay,
    };

    const peopleAhead = await countPeopleAhead(bucket, {
      scheduledFor: appt.scheduledFor,
      queueNumber: appt.queueNumber,
    });

    if (peopleAhead === 1) {
      sentQueueAlerts.add(appointmentId);
      await SmsService.sendQueueAlertSms({
        patientName: appt.patient.name,
        patientPhone: appt.patient.phone,
        hospitalName: appt.hospital.name,
        departmentName: appt.department.name,
        queueNumber: appt.queueNumber,
        receiveSms: appt.receiveSms,
      });
    }
  } catch (err) {
    logger.warn("Error in checkAndTriggerQueueAlert", { err });
  }
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

  const now = new Date();
  const slotStart = new Date(now);
  slotStart.setMinutes(0, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };
  const slotLabel = `${formatHour(slotStart.getHours())} – ${formatHour(slotEnd.getHours())}`;

  // Find any active IN_PROGRESS appointment to finish
  const current = await prisma.appointment.findFirst({
    where: { ...bucket, status: "IN_PROGRESS" },
    orderBy: [{ scheduledFor: "asc" }, { queueNumber: "asc" }],
  });

  // Find appointments in current time slot window on today's date
  const slotAppointments = await prisma.appointment.findMany({
    where: {
      ...bucket,
      scheduledFor: {
        gte: slotStart,
        lt: slotEnd,
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: [{ queueNumber: "asc" }],
  });

  const nextConfirmed = slotAppointments.find((a) => a.status === "CONFIRMED");
  const hasPendingInSlot = slotAppointments.some((a) => a.status === "PENDING");

  if (!nextConfirmed) {
    if (hasPendingInSlot) {
      throw ApiError.badRequest(
        "Cannot call patient because appointment status is pending confirmation. Please confirm the booking first.",
      );
    }
    throw ApiError.badRequest(
      `No confirmed patient found to call for the current time slot (${slotLabel}).`,
    );
  }

  const { completed, promoted } = await prisma.$transaction(async (tx) => {
    const finished = current
      ? await tx.appointment.update({
          where: { id: current.id },
          data: { status: "COMPLETED", completedAt: new Date() },
          include: appointmentInclude,
        })
      : null;

    const started = await tx.appointment.update({
      where: { id: nextConfirmed.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
        ...(nextConfirmed.doctorId ? {} : { doctorId }),
      },
      include: appointmentInclude,
    });

    return { completed: finished, promoted: started };
  });

  if (completed) {
    publishAppointmentChange(completed, "status");
    SmsService.sendAppointmentCompletedSms({
      patientName: completed.patient.name,
      patientPhone: completed.patient.phone,
      hospitalName: completed.hospital.name,
      doctorName: completed.doctor?.name,
      receiveSms: completed.receiveSms,
    }).catch((err) => logger.warn("Failed to send completed SMS", { err }));
  }
  if (promoted) publishAppointmentChange(promoted, "status");

  // Asynchronously check if any waiting patient now has 1 person ahead
  (async () => {
    try {
      const waitingList = await prisma.appointment.findMany({
        where: {
          hospitalId: bucket.hospitalId,
          departmentId: bucket.departmentId,
          scheduledDay: bucket.scheduledDay,
          status: "CONFIRMED",
        },
        include: {
          patient: { select: { name: true, phone: true } },
          hospital: { select: { name: true } },
          department: { select: { name: true } },
        },
      });

      for (const appt of waitingList) {
        await checkAndTriggerQueueAlert(appt.id);
      }
    } catch (err) {
      logger.warn("Error checking 1-person-ahead queue alerts", { err });
    }
  })();

  return {
    completed: completed ? toAppointment(completed) : null,
    nowServing: promoted ? toAppointment(promoted) : null,
    queue: await getDepartmentQueue(department.id, day),
  };
}
