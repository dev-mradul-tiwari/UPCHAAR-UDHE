import { Router } from "express";
import { medicalHistorySchema } from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  getPatientRecord,
  updatePatientPhone,
  upsertOwnRecord,
} from "../services/record.service.js";
import { ApiError } from "../utils/api-error.js";
import { ok } from "../utils/respond.js";
import { parseBody, requiredParam } from "../utils/validate.js";

export const recordsRouter: Router = Router();

recordsRouter.get("/me", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  ok(res, "Medical record", await getPatientRecord(auth.sub));
});

recordsRouter.put("/me", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(medicalHistorySchema, req);
  ok(res, "Medical record updated", await upsertOwnRecord(auth.sub, input));
});

recordsRouter.patch("/me/phone", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const { phone } = req.body || {};
  if (!phone || typeof phone !== "string") {
    throw ApiError.badRequest("Phone number is required");
  }
  ok(res, "Mobile number updated", await updatePatientPhone(auth.sub, phone));
});

recordsRouter.get("/patient/:patientId", requireAuth("DOCTOR", "HOSPITAL"), async (req, res) => {
  const patientId = requiredParam(req, "patientId");
  ok(res, "Patient record", await getPatientRecord(patientId));
});
