import { z } from "zod";
import {
  AppointmentStatusSchema,
  AppointmentTypeSchema,
  BedTypeSchema,
  emailSchema,
  idSchema,
  phoneSchema,
} from "./common.js";

/* ----------------------------------------------------------- departments */

export const departmentInputSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(300).optional(),
  headDoctorId: idSchema.optional().nullable(),
  avgConsultMinutes: z.coerce.number().int().min(1).max(180).default(15),
});
export type DepartmentInput = z.infer<typeof departmentInputSchema>;

export const departmentUpdateSchema = departmentInputSchema.partial();
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

export type Department = {
  id: string;
  name: string;
  description: string | null;
  avgConsultMinutes: number;
  hospitalId: string;
  headDoctor: { id: string; name: string } | null;
  doctorCount: number;
};

/* --------------------------------------------------------------- doctors */

export const doctorCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  specialization: z.string().trim().min(2).max(80),
  experienceYears: z.coerce.number().int().min(0).max(70).default(0),
  departmentId: idSchema.optional().nullable(),
});
export type DoctorCreateInput = z.infer<typeof doctorCreateSchema>;

export const doctorUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  specialization: z.string().trim().min(2).max(80).optional(),
  experienceYears: z.coerce.number().int().min(0).max(70).optional(),
  departmentId: idSchema.nullable().optional(),
  isAvailable: z.boolean().optional(),
});
export type DoctorUpdateInput = z.infer<typeof doctorUpdateSchema>;

export const doctorSelfUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  specialization: z.string().trim().min(2).max(80).optional(),
});
export type DoctorSelfUpdateInput = z.infer<typeof doctorSelfUpdateSchema>;

export const availabilitySchema = z.object({ isAvailable: z.boolean() });
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export type Doctor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experienceYears: number;
  rating: number;
  isAvailable: boolean;
  mustChangePassword: boolean;
  hospitalId: string;
  hospitalName: string | null;
  departmentId: string | null;
  departmentName: string | null;
};

/** Returned once, on creation only. */
export type DoctorProvisioned = {
  doctor: Doctor;
  tempPassword: string;
};

export type DoctorStats = {
  todayTotal: number;
  seenToday: number;
  waitingToday: number;
  avgConsultMinutes: number;
  onDuty: boolean;
};

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
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const appointmentStatusUpdateSchema = z.object({
  status: AppointmentStatusSchema,
  notes: z.string().trim().max(1000).optional(),
});
export type AppointmentStatusUpdateInput = z.infer<
  typeof appointmentStatusUpdateSchema
>;

export const assignDoctorSchema = z.object({ doctorId: idSchema });
export type AssignDoctorInput = z.infer<typeof assignDoctorSchema>;

export const appointmentListQuerySchema = z.object({
  status: AppointmentStatusSchema.optional(),
  date: z.string().optional(),
  departmentId: idSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;

export type Appointment = {
  id: string;
  reason: string;
  status: z.infer<typeof AppointmentStatusSchema>;
  type: z.infer<typeof AppointmentTypeSchema>;
  scheduledFor: string;
  queueNumber: number;
  notes: string | null;
  receiveSms?: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  patient: { id: string; name: string; phone: string } | null;
  hospital: { id: string; name: string; city: string } | null;
  department: { id: string; name: string } | null;
  doctor: { id: string; name: string; specialization: string } | null;
};

/* ----------------------------------------------------------------- queue */

export type QueueStatus = {
  appointmentId: string;
  status: z.infer<typeof AppointmentStatusSchema>;
  queueNumber: number;
  position: number | null;
  peopleAhead: number | null;
  estimatedWaitMinutes: number | null;
  nowServing: number | null;
  departmentId: string;
  departmentName: string;
  scheduledFor?: string;
};

export type QueueEntry = {
  appointmentId: string;
  patientId: string;
  queueNumber: number;
  status: z.infer<typeof AppointmentStatusSchema>;
  patientName: string;
  reason: string;
  scheduledFor: string;
};

export type DepartmentQueue = {
  departmentId: string;
  departmentName: string;
  avgConsultMinutes: number;
  nowServing: number | null;
  entries: QueueEntry[];
};

export type SlotAvailability = {
  slotStart: string;
  slotEnd: string;
  startTimeIso: string;
  capacity: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
  isPast?: boolean;
};

/* ------------------------------------------------------------------ beds */

export const bedInputSchema = z.object({
  beds: z
    .array(
      z
        .object({
          type: BedTypeSchema,
          total: z.coerce.number().int().min(0).max(10_000),
          available: z.coerce.number().int().min(0).max(10_000),
        })
        .refine((b) => b.available <= b.total, {
          message: "Available beds cannot exceed total",
          path: ["available"],
        }),
    )
    .min(1),
});
export type BedInput = z.infer<typeof bedInputSchema>;

/* ------------------------------------------------------------- inventory */

export const medicineInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  threshold: z.coerce.number().int().min(0).max(1_000_000).default(10),
  unit: z.string().trim().min(1).max(30).default("tablets"),
  expiryDate: z.coerce.date(),
});
export type MedicineInput = z.infer<typeof medicineInputSchema>;

export const medicineUpdateSchema = medicineInputSchema.partial();
export type MedicineUpdateInput = z.infer<typeof medicineUpdateSchema>;

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  lowStock: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .optional(),
  expiringInDays: z.coerce.number().int().min(1).max(3650).optional(),
});
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;

export type Medicine = {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
  unit: string;
  expiryDate: string;
  isLowStock: boolean;
  daysToExpiry: number;
};

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
export type MedicalHistoryInput = z.infer<typeof medicalHistorySchema>;

export type MedicalHistory = MedicalHistoryInput & {
  id: string;
  patientId: string;
  updatedAt: string;
};

export type ConsultationNote = {
  id: string;
  doctorName: string;
  doctorDepartment?: string | null;
  hospitalName: string;
  date: string;
  notes?: string | null;
  reason: string;
  status?: string;
  scheduledFor?: string;
  queueNumber?: number;
};

export type PatientRecord = {
  patient: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string | null;
  };
  medicalHistory: MedicalHistory | null;
  consultations?: ConsultationNote[];
};

export const createReferralSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  reason: z.string().min(3, "Reason for referral is required"),
  targetSpecialization: z.string().optional().nullable(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;

export type Referral = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  referringDoctorId: string;
  referringDoctorName: string;
  referringDoctorSpecialization: string;
  referringHospitalId: string;
  referringHospitalName: string;
  referringHospitalCity: string;
  reason: string;
  targetSpecialization?: string | null;
  status: string;
  connectedDoctorId?: string | null;
  connectedDoctorName?: string | null;
  connectedHospitalId?: string | null;
  connectedHospitalName?: string | null;
  createdAt: string;
};

/* ------------------------------------------------------------- feedback */

export const createFeedbackSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  doctorRating: z.coerce.number().int().min(1).max(5),
  hospitalRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().nullable(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export type Feedback = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  doctorRating: number;
  hospitalRating: number;
  comment: string | null;
  createdAt: string;
  doctorName?: string;
  hospitalName?: string;
};
