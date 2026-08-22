import { Router } from "express";

import { prisma } from "../lib/db.js";
import { getAuth, getHospitalScope, requireAuth } from "../middleware/auth.js";
import { assertCanViewAppointment } from "../services/appointment.service.js";
import { assertOwnedDepartment } from "../services/department.service.js";
import { callNext, getAvailableSlots, getDepartmentQueue, getQueueStatus } from "../services/queue.service.js";
import { ApiError } from "../utils/api-error.js";
import { ok } from "../utils/respond.js";
import { requiredParam } from "../utils/validate.js";

export const queueRouter: Router = Router();

queueRouter.get("/slots", async (req, res) => {
  const hospitalId = req.query.hospitalId as string;
  const departmentId = req.query.departmentId as string;
  const dateStr = typeof req.query.date === "string" && req.query.date.length > 0
    ? req.query.date
    : new Date().toISOString().slice(0, 10);

  if (!hospitalId || !departmentId) {
    throw ApiError.badRequest("hospitalId and departmentId query params are required");
  }

  const slots = await getAvailableSlots(hospitalId, departmentId, dateStr);
  ok(res, "Available time slots", slots);
});

queueRouter.get("/appointment/:id", requireAuth(), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { patientId: true, hospitalId: true, doctorId: true },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");
  assertCanViewAppointment(auth, appointment);

  ok(res, "Queue status", await getQueueStatus(id));
});

queueRouter.get(
  "/department/:departmentId",
  requireAuth("DOCTOR", "HOSPITAL"),
  async (req, res) => {
    const departmentId = requiredParam(req, "departmentId");
    await assertOwnedDepartment(departmentId, getHospitalScope(req));
    ok(res, "Department queue", await getDepartmentQueue(departmentId));
  },
);

queueRouter.post(
  "/department/:departmentId/next",
  requireAuth("DOCTOR"),
  async (req, res) => {
    const auth = getAuth(req);
    const departmentId = requiredParam(req, "departmentId");
    await assertOwnedDepartment(departmentId, getHospitalScope(req));
    const result = await callNext(departmentId, auth.sub);
    ok(
      res,
      result.nowServing ? "Next patient called" : "Queue is empty",
      result,
    );
  },
);
