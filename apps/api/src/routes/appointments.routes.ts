import { Router } from "express";
import {
  appointmentListQuerySchema,
  appointmentStatusUpdateSchema,
  assignDoctorSchema,
  bookAppointmentSchema,
} from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  assignDoctor,
  cancelOwnAppointment,
  getAppointmentForCaller,
  listAppointments,
  updateAppointmentStatus,
} from "../services/appointment.service.js";
import { bookAppointment } from "../services/queue.service.js";
import { created, ok } from "../utils/respond.js";
import { parseBody, parseQuery, requiredParam } from "../utils/validate.js";

export const appointmentsRouter: Router = Router();

appointmentsRouter.post("/", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(bookAppointmentSchema, req);
  const appointment = await bookAppointment(auth.sub, input);
  created(res, "Appointment booked", appointment);
});

/* Registered before "/:id" so "mine" is never treated as an id. */
appointmentsRouter.get("/mine", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const query = parseQuery(appointmentListQuerySchema, req);
  ok(res, "Your appointments", await listAppointments(auth, query));
});

appointmentsRouter.get("/", requireAuth("HOSPITAL", "DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  const query = parseQuery(appointmentListQuerySchema, req);
  ok(res, "Appointments", await listAppointments(auth, query));
});

appointmentsRouter.get("/:id", requireAuth(), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  ok(res, "Appointment", await getAppointmentForCaller(auth, id));
});

import { bus } from "../lib/events.js";
import { prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";

appointmentsRouter.post("/:id/request-video", async (req, res, next) => {
  try {
    const id = requiredParam(req, "id");

    // Find the appointment to get the department and hospital
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, hospitalId: true, departmentId: true, patientId: true, scheduledDay: true }
    });

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Emit the event to the doctor's queue stream!
    // We send reason: 'video-request' (which is technically not in the type, but we can cast it)
    bus.publishAppointmentChanged({
      appointmentId: appointment.id,
      hospitalId: appointment.hospitalId,
      departmentId: appointment.departmentId,
      patientId: appointment.patientId,
      scheduledDay: appointment.scheduledDay.toISOString(),
      reason: "video-request" as any,
    });

    ok(res, "Video request sent", null);
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.patch(
  "/:id/status",
  requireAuth("HOSPITAL", "DOCTOR"),
  async (req, res) => {
    const auth = getAuth(req);
    const id = requiredParam(req, "id");
    const input = parseBody(appointmentStatusUpdateSchema, req);
    const appointment = await updateAppointmentStatus(auth, id, input);
    ok(res, `Appointment ${input.status.toLowerCase().replace("_", " ")}`, appointment);
  },
);

appointmentsRouter.patch("/:id/assign", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  const input = parseBody(assignDoctorSchema, req);
  ok(res, "Doctor assigned", await assignDoctor(auth.sub, id, input.doctorId));
});

appointmentsRouter.delete("/:id", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  ok(res, "Appointment cancelled", await cancelOwnAppointment(auth.sub, id));
});
