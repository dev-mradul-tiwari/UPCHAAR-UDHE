import { Router } from "express";
import {
  changePasswordSchema,
  hospitalRegisterSchema,
  loginSchema,
  patientRegisterSchema,
} from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  changeDoctorPassword,
  getMe,
  loginDoctor,
  loginHospital,
  loginPatient,
  registerHospital,
  registerPatient,
} from "../services/auth.service.js";
import { created, ok } from "../utils/respond.js";
import { parseBody } from "../utils/validate.js";

export const authRouter: Router = Router();

authRouter.post("/patient/register", async (req, res) => {
  const input = parseBody(patientRegisterSchema, req);
  const result = await registerPatient(input);
  created(res, "Account created", result);
});

authRouter.post("/patient/login", async (req, res) => {
  const input = parseBody(loginSchema, req);
  const result = await loginPatient(input);
  ok(res, "Signed in", result);
});

authRouter.post("/hospital/register", async (req, res) => {
  const input = parseBody(hospitalRegisterSchema, req);
  const result = await registerHospital(input);
  created(res, "Hospital registered", result);
});

authRouter.post("/hospital/login", async (req, res) => {
  const input = parseBody(loginSchema, req);
  const result = await loginHospital(input);
  ok(res, "Signed in", result);
});

authRouter.post("/doctor/login", async (req, res) => {
  const input = parseBody(loginSchema, req);
  const result = await loginDoctor(input);
  ok(res, "Signed in", result);
});

authRouter.post("/doctor/change-password", requireAuth("DOCTOR"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(changePasswordSchema, req);
  const doctor = await changeDoctorPassword(auth.sub, input.currentPassword, input.newPassword);
  ok(res, "Password updated", { doctor });
});

authRouter.get("/me", requireAuth(), async (req, res) => {
  const auth = getAuth(req);
  const me = await getMe(auth.role, auth.sub);
  ok(res, "Session", me);
});
