import { prisma } from "@upchaar/db";
import type { CreateFeedbackInput, Feedback } from "@upchaar/types";
import { ApiError } from "../utils/api-error.js";

export async function submitFeedback(
  patientId: string,
  input: CreateFeedbackInput,
): Promise<Feedback> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: {
      feedback: true,
      doctor: true,
      hospital: true,
    },
  });

  if (!appointment) {
    throw ApiError.notFound("Appointment not found");
  }

  if (appointment.patientId !== patientId) {
    throw ApiError.forbidden("You can only provide feedback for your own appointments");
  }

  if (appointment.status !== "COMPLETED") {
    throw ApiError.badRequest("Feedback can only be submitted for completed appointments");
  }

  if (appointment.feedback) {
    throw ApiError.badRequest("Feedback has already been submitted for this appointment");
  }

  if (!appointment.doctorId) {
    throw ApiError.badRequest("Cannot submit feedback for an appointment without an assigned doctor");
  }

  const feedback = await prisma.feedback.create({
    data: {
      appointmentId: appointment.id,
      patientId,
      doctorId: appointment.doctorId,
      hospitalId: appointment.hospitalId,
      doctorRating: input.doctorRating,
      hospitalRating: input.hospitalRating,
      comment: input.comment ?? null,
    },
    include: {
      doctor: { select: { name: true } },
      hospital: { select: { name: true } },
    },
  });

  // Recalculate and update Doctor rating
  const doctorAgg = await prisma.feedback.aggregate({
    _avg: { doctorRating: true },
    where: { doctorId: appointment.doctorId },
  });
  const avgDoctorRating = doctorAgg._avg.doctorRating
    ? Math.round(doctorAgg._avg.doctorRating * 10) / 10
    : 4.0;

  await prisma.doctor.update({
    where: { id: appointment.doctorId },
    data: { rating: avgDoctorRating },
  });

  // Recalculate and update Hospital rating
  const hospitalAgg = await prisma.feedback.aggregate({
    _avg: { hospitalRating: true },
    where: { hospitalId: appointment.hospitalId },
  });
  const avgHospitalRating = hospitalAgg._avg.hospitalRating
    ? Math.round(hospitalAgg._avg.hospitalRating * 10) / 10
    : 4.0;

  await prisma.hospital.update({
    where: { id: appointment.hospitalId },
    data: { rating: avgHospitalRating },
  });

  return {
    id: feedback.id,
    appointmentId: feedback.appointmentId,
    patientId: feedback.patientId,
    doctorId: feedback.doctorId,
    hospitalId: feedback.hospitalId,
    doctorRating: feedback.doctorRating,
    hospitalRating: feedback.hospitalRating,
    comment: feedback.comment,
    createdAt: feedback.createdAt.toISOString(),
    doctorName: feedback.doctor.name,
    hospitalName: feedback.hospital.name,
  };
}

export async function getPendingFeedback(patientId: string) {
  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      status: "COMPLETED",
      feedback: null,
    },
    orderBy: { completedAt: "desc" },
    include: {
      doctor: { select: { id: true, name: true, specialization: true } },
      hospital: { select: { id: true, name: true, city: true } },
    },
  });

  return pendingAppointments.map((appt) => ({
    appointmentId: appt.id,
    scheduledFor: appt.scheduledFor.toISOString(),
    completedAt: appt.completedAt ? appt.completedAt.toISOString() : null,
    doctor: appt.doctor,
    hospital: appt.hospital,
  }));
}
