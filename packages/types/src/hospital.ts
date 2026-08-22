import { z } from "zod";
import { BedTypeSchema, emailSchema, phoneSchema } from "./common.js";

export const hospitalSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  departmentId: z.string().optional(),
  hasBeds: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type HospitalSearchQuery = z.infer<typeof hospitalSearchQuerySchema>;

export const hospitalUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  type: z.string().trim().min(2).max(60).optional(),
  addressLine: z.string().trim().min(3).max(200).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  state: z.string().trim().min(2).max(80).optional(),
  zipcode: z.string().trim().min(4).max(12).optional(),
});
export type HospitalUpdateInput = z.infer<typeof hospitalUpdateSchema>;

export type BedSummary = {
  type: z.infer<typeof BedTypeSchema>;
  total: number;
  available: number;
};

export type HospitalSummary = {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  addressLine: string;
  zipcode: string;
  phone: string;
  rating: number;
  departmentCount: number;
  doctorCount: number;
  beds: BedSummary[];
  totalBeds: number;
  availableBeds: number;
};

export type HospitalDetail = HospitalSummary & {
  email: string;
  registrationNumber: string;
  departments: {
    id: string;
    name: string;
    description: string | null;
    avgConsultMinutes: number;
    doctorCount: number;
    headDoctor: { id: string; name: string } | null;
  }[];
  doctors: {
    id: string;
    name: string;
    specialization: string;
    experienceYears: number;
    isAvailable: boolean;
    departmentId: string | null;
    departmentName: string | null;
  }[];
};

export type HospitalStats = {
  appointmentsToday: number;
  pendingToday: number;
  completedToday: number;
  bedOccupancyPct: number;
  totalBeds: number;
  availableBeds: number;
  lowStockCount: number;
  expiringSoonCount: number;
  doctorCount: number;
  departmentLoad: {
    departmentId: string;
    departmentName: string;
    total: number;
    waiting: number;
  }[];
};
