import { z } from "zod";
/* ------------------------------------------------------------------ enums */
export const RoleSchema = z.enum(["PATIENT", "DOCTOR", "HOSPITAL"]);
export const GenderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export const AppointmentStatusSchema = z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "TIMED_OUT",
]);
export const AppointmentTypeSchema = z.enum(["IN_PERSON", "VIDEO"]);
export const BedTypeSchema = z.enum(["ICU", "GENERAL", "PREMIUM"]);
export const BLOOD_GROUPS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
];
export const BloodGroupSchema = z.enum(BLOOD_GROUPS);
/** Status values a patient's appointment may move to, keyed by current status. */
export const ALLOWED_STATUS_TRANSITIONS = {
    PENDING: ["CONFIRMED", "CANCELLED", "TIMED_OUT"],
    CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
    TIMED_OUT: [],
};
export const apiResponseSchema = (data) => z.object({
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
//# sourceMappingURL=common.js.map