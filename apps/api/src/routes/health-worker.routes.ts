import { Router } from "express";
import { prisma } from "../lib/db.js";
import { getAuth, requireAuth } from "../middleware/auth.js";
import { created, ok } from "../utils/respond.js";
import { parseBody } from "../utils/validate.js";
import { z } from "zod";
import crypto from "crypto";

export const healthWorkerRouter: Router = Router();

const walkInPatientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(6).optional().default("Upchaar123!"),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

const vitalsSchema = z.object({
  patientId: z.string(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  temperature: z.number().optional(),
  weight: z.number().optional(),
  bloodSugar: z.number().optional(),
  symptoms: z.string().optional(),
});

// ASHA worker registers a walk-in patient
healthWorkerRouter.post("/patients", requireAuth("ASHA" as any, "ANM" as any), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(walkInPatientSchema, req);

  const { hashPassword } = await import("../lib/password.js");

  // Create patient and assign to the health worker in one transaction
  const patient = await prisma.$transaction(async (tx) => {
    const newPatient = await tx.patient.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
      },
    });

    await tx.healthWorkerPatientAssignment.create({
      data: {
        healthWorkerId: auth.sub,
        patientId: newPatient.id,
      },
    });

    return newPatient;
  });

  created(res, "Patient registered and assigned successfully", { patient });
});

// ASHA worker submits vitals
healthWorkerRouter.post("/vitals", requireAuth("ASHA" as any, "ANM" as any), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(vitalsSchema, req);

  const vitals = await prisma.fieldVitals.create({
    data: {
      healthWorkerId: auth.sub,
      patientId: input.patientId,
      bloodPressureSystolic: input.bloodPressureSystolic,
      bloodPressureDiastolic: input.bloodPressureDiastolic,
      temperature: input.temperature,
      weight: input.weight,
      bloodSugar: input.bloodSugar,
    },
  });

  // Basic Triage Logic (can be replaced by Gemini AI in future)
  if (
    (input.bloodPressureSystolic && input.bloodPressureSystolic > 140) || 
    (input.temperature && input.temperature > 101) || 
    (input.bloodSugar && input.bloodSugar > 200)
  ) {
    await prisma.highRiskFlag.create({
      data: {
        healthWorkerId: auth.sub,
        patientId: input.patientId,
        category: "Critical Vitals",
      },
    });
  }

  created(res, "Vitals recorded successfully", { vitals });
});

// ASHA worker fetches their assigned patients
healthWorkerRouter.get("/patients", requireAuth("ASHA" as any, "ANM" as any), async (req, res) => {
  const auth = getAuth(req);
  
  const assignments = await prisma.healthWorkerPatientAssignment.findMany({
    where: { healthWorkerId: auth.sub },
    orderBy: { createdAt: "desc" }
  });

  const patientIds = assignments.map(a => a.patientId);
  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    select: { id: true, name: true, phone: true, gender: true, dateOfBirth: true }
  });

  ok(res, "Assigned patients fetched", { patients });
});
