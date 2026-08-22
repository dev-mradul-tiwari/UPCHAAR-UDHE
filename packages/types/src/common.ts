import { z } from "zod";

/* ------------------------------------------------------------------ enums */

export const RoleSchema = z.enum(["PATIENT", "DOCTOR", "HOSPITAL"]);
export type Role = z.infer<typeof RoleSchema>;

export const GenderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Gender = z.infer<typeof GenderSchema>;

export const AppointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const BedTypeSchema = z.enum(["ICU", "GENERAL", "PREMIUM"]);
export type BedType = z.infer<typeof BedTypeSchema>;

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export const BloodGroupSchema = z.enum(BLOOD_GROUPS);
export type BloodGroup = z.infer<typeof BloodGroupSchema>;

/** Status values a patient's appointment may move to, keyed by current status. */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/* --------------------------------------------------------------- envelope */

/**
 * Every API response uses this shape — see docs/API_CONTRACT.md.
 * `data` is null on failure.
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: data.nullable(),
  });

/* ------------------------------------------------------------- primitives */

export const idSchema = z.string().min(1, "Required");
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number");
export const isoDateSchema = z.string().datetime({ offset: true }).or(z.string().datetime());

/* ------------------------------------------------------------- pagination */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
