import { Router } from "express";
import {
  availabilitySchema,
  doctorCreateSchema,
  doctorSelfUpdateSchema,
  doctorUpdateSchema,
} from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctorStats,
  listDoctors,
  setAvailability,
  updateDoctor,
  updateOwnProfile,
} from "../services/doctor.service.js";
import { doctorListQuerySchema } from "../utils/query.js";
import { created, ok } from "../utils/respond.js";
import { parseBody, parseQuery, requiredParam } from "../utils/validate.js";

export const doctorsRouter: Router = Router();

/* -------------------------------------------------------------- doctor me */
/* Registered before "/:id" so "me" is never treated as an id. */

doctorsRouter.get("/me", requireAuth("DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  ok(res, "Doctor profile", await getDoctor(auth.sub));
});

doctorsRouter.patch("/me", requireAuth("DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(doctorSelfUpdateSchema, req);
  ok(res, "Profile updated", await updateOwnProfile(auth.sub, input));
});

doctorsRouter.patch("/me/availability", requireAuth("DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(availabilitySchema, req);
  const doctor = await setAvailability(auth.sub, input.isAvailable);
  ok(res, input.isAvailable ? "You are on duty" : "You are off duty", doctor);
});

doctorsRouter.get("/me/stats", requireAuth("DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  ok(res, "Doctor stats", await getDoctorStats(auth.sub));
});

/* ------------------------------------------------------- public + hospital */

doctorsRouter.get("/", async (req, res) => {
  const query = parseQuery(doctorListQuerySchema, req);
  ok(res, "Doctors", await listDoctors(query));
});

doctorsRouter.post("/", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(doctorCreateSchema, req);
  const result = await createDoctor(auth.sub, input);
  created(res, "Doctor provisioned — share the temporary password now", result);
});

doctorsRouter.patch("/:id", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  const input = parseBody(doctorUpdateSchema, req);
  ok(res, "Doctor updated", await updateDoctor(auth.sub, id, input));
});

doctorsRouter.delete("/:id", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  ok(res, "Doctor removed", await deleteDoctor(auth.sub, id));
});
