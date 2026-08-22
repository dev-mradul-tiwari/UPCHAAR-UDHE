import { Router } from "express";
import { hospitalSearchQuerySchema, hospitalUpdateSchema } from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  getHospitalDetail,
  getHospitalStats,
  searchHospitals,
  updateHospital,
} from "../services/hospital.service.js";
import { ok } from "../utils/respond.js";
import { parseBody, parseQuery, requiredParam } from "../utils/validate.js";

export const hospitalsRouter: Router = Router();

/* ------------------------------------------------------------ hospital me */
/* Registered before "/:id" so "me" is never treated as an id. */

hospitalsRouter.get("/me", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  ok(res, "Hospital profile", await getHospitalDetail(auth.sub));
});

hospitalsRouter.patch("/me", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(hospitalUpdateSchema, req);
  ok(res, "Hospital updated", await updateHospital(auth.sub, input));
});

hospitalsRouter.get("/me/stats", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  ok(res, "Hospital stats", await getHospitalStats(auth.sub));
});

/* ---------------------------------------------------------------- public */

hospitalsRouter.get("/", async (req, res) => {
  const query = parseQuery(hospitalSearchQuerySchema, req);
  ok(res, "Hospitals", await searchHospitals(query));
});

hospitalsRouter.get("/:id", async (req, res) => {
  const id = requiredParam(req, "id");
  ok(res, "Hospital", await getHospitalDetail(id));
});
