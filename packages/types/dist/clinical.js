import { z } from "zod";
import { AppointmentStatusSchema, AppointmentTypeSchema, BedTypeSchema, emailSchema, idSchema, phoneSchema, } from "./common.js";
/* ----------------------------------------------------------- departments */
export const departmentInputSchema = z.object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    description: z.string().trim().max(300).optional(),
    headDoctorId: idSchema.optional().nullable(),
    avgConsultMinutes: z.coerce.number().int().min(1).max(180).default(15),
});
export const departmentUpdateSchema = departmentInputSchema.partial();
/* --------------------------------------------------------------- doctors */
export const doctorCreateSchema = z.object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    phone: phoneSchema,
    specialization: z.string().trim().min(2).max(80),
    experienceYears: z.coerce.number().int().min(0).max(70).default(0),
    departmentId: idSchema.optional().nullable(),
});
export const doctorUpdateSchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: phoneSchema.optional(),
    specialization: z.string().trim().min(2).max(80).optional(),
    experienceYears: z.coerce.number().int().min(0).max(70).optional(),
    departmentId: idSchema.nullable().optional(),
    isAvailable: z.boolean().optional(),
});
export const doctorSelfUpdateSchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: phoneSchema.optional(),
    specialization: z.string().trim().min(2).max(80).optional(),
});
export const availabilitySchema = z.object({ isAvailable: z.boolean() });
/* ---------------------------------------------------------- appointments */
export const bookAppointmentSchema = z.object({
    hospitalId: idSchema,
    departmentId: idSchema,
    doctorId: idSchema.optional().nullable(),
    reason: z.string().trim().min(3, "Tell us briefly why you're visiting").max(300),
    scheduledFor: z.coerce.date().refine((d) => d.getTime() + 60 * 60 * 1000 > Date.now(), {
        message: "Pick a time slot that has not ended yet",
    }),
    type: AppointmentTypeSchema.default("IN_PERSON"),
    receiveSms: z.boolean().default(true),
});
export const appointmentStatusUpdateSchema = z.object({
    status: AppointmentStatusSchema,
    notes: z.string().trim().max(1000).optional(),
});
export const assignDoctorSchema = z.object({ doctorId: idSchema });
export const appointmentListQuerySchema = z.object({
    status: AppointmentStatusSchema.optional(),
    date: z.string().optional(),
    departmentId: idSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
/* ------------------------------------------------------------------ beds */
export const bedInputSchema = z.object({
    beds: z
        .array(z
        .object({
        type: BedTypeSchema,
        total: z.coerce.number().int().min(0).max(10_000),
        available: z.coerce.number().int().min(0).max(10_000),
    })
        .refine((b) => b.available <= b.total, {
        message: "Available beds cannot exceed total",
        path: ["available"],
    }))
        .min(1),
});
/* ------------------------------------------------------------- inventory */
export const medicineInputSchema = z.object({
    name: z.string().trim().min(2).max(120),
    quantity: z.coerce.number().int().min(0).max(1_000_000),
    threshold: z.coerce.number().int().min(0).max(1_000_000).default(10),
    unit: z.string().trim().min(1).max(30).default("tablets"),
    expiryDate: z.coerce.date(),
});
export const medicineUpdateSchema = medicineInputSchema.partial();
export const inventoryQuerySchema = z.object({
    q: z.string().trim().max(120).optional(),
    lowStock: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .transform((v) => v === true || v === "true")
        .optional(),
    expiringInDays: z.coerce.number().int().min(1).max(3650).optional(),
});
/* ------------------------------------------------------- medical records */
export const medicalHistorySchema = z.object({
    chronicDiseases: z.array(z.string().trim().min(1)).max(40).default([]),
    allergies: z.array(z.string().trim().min(1)).max(40).default([]),
    pastSurgeries: z.array(z.string().trim().min(1)).max(40).default([]),
    currentMedications: z.array(z.string().trim().min(1)).max(40).default([]),
    smoking: z.boolean().default(false),
    alcohol: z.boolean().default(false),
    notes: z.string().trim().max(2000).optional().nullable(),
});
export const createReferralSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    reason: z.string().min(3, "Reason for referral is required"),
    targetSpecialization: z.string().optional().nullable(),
});
/* ------------------------------------------------------------- feedback */
export const createFeedbackSchema = z.object({
    appointmentId: z.string().min(1, "Appointment ID is required"),
    doctorRating: z.coerce.number().int().min(1).max(5),
    hospitalRating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(500).optional().nullable(),
});
//# sourceMappingURL=clinical.js.map