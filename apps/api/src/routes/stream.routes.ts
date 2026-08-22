import { Router } from "express";

import { appointmentInclude, prisma } from "../lib/db.js";
import { bus } from "../lib/events.js";
import { openSseStream } from "../lib/sse.js";
import { getAuth, getHospitalScope, requireStreamAuth } from "../middleware/auth.js";
import { assertCanViewAppointment } from "../services/appointment.service.js";
import { assertOwnedDepartment } from "../services/department.service.js";
import { getDepartmentQueue, getQueueStatus } from "../services/queue.service.js";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";
import { toAppointment } from "../utils/serializers.js";
import { requiredParam } from "../utils/validate.js";

export const streamRouter: Router = Router();

/**
 * SSE endpoints. `EventSource` cannot send headers, so these accept `?token=`.
 * Events: `queue.updated` and `appointment.updated` (see docs/API_CONTRACT.md).
 */

streamRouter.get(
  "/queue/:departmentId",
  requireStreamAuth("DOCTOR", "HOSPITAL"),
  async (req, res) => {
    const departmentId = requiredParam(req, "departmentId");
    await assertOwnedDepartment(departmentId, getHospitalScope(req));

    let unsubscribe = (): void => {};
    const stream = openSseStream(req, res, () => unsubscribe());

    const pushQueue = async (): Promise<void> => {
      if (stream.isClosed()) return;
      stream.send("queue.updated", await getDepartmentQueue(departmentId));
    };

    unsubscribe = bus.onDepartment(departmentId, (event) => {
      void (async () => {
        try {
          const appointment = await prisma.appointment.findUnique({
            where: { id: event.appointmentId },
            include: appointmentInclude,
          });
          if (appointment) stream.send("appointment.updated", toAppointment(appointment));
          await pushQueue();
        } catch (error) {
          logger.error("Failed to push queue event", { departmentId, error });
        }
      })();
    });

    try {
      await pushQueue();
    } catch (error) {
      logger.error("Failed to send initial queue snapshot", { departmentId, error });
      stream.close();
    }
  },
);

streamRouter.get("/appointment/:id", requireStreamAuth(), async (req, res) => {
  const auth = getAuth(req);
  const appointmentId = requiredParam(req, "id");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { patientId: true, hospitalId: true, doctorId: true, departmentId: true },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");
  assertCanViewAppointment(auth, appointment);

  let unsubscribe = (): void => {};
  const stream = openSseStream(req, res, () => unsubscribe());

  const pushSnapshot = async (): Promise<void> => {
    if (stream.isClosed()) return;
    const current = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude,
    });
    if (current) stream.send("appointment.updated", toAppointment(current));
    stream.send("queue.updated", await getQueueStatus(appointmentId));
  };

  // Subscribe to the *department* channel: this patient's position changes
  // whenever anyone ahead of them is served, not only on their own row.
  unsubscribe = bus.onDepartment(appointment.departmentId, () => {
    void pushSnapshot().catch((error: unknown) => {
      logger.error("Failed to push appointment event", { appointmentId, error });
    });
  });

  try {
    await pushSnapshot();
  } catch (error) {
    logger.error("Failed to send initial appointment snapshot", { appointmentId, error });
    stream.close();
  }
});
