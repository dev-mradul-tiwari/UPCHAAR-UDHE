import { Router } from "express";
import { medicalHistorySchema } from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  getPatientRecord,
  getPatientRecordForDoctor,
  upsertOwnRecord,
} from "../services/record.service.js";
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

recordsRouter.get("/patient/:patientId", requireAuth("DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  const patientId = requiredParam(req, "patientId");
  ok(res, "Patient record", await getPatientRecordForDoctor(auth.sub, patientId));
});
