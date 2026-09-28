import { z } from "zod";
export declare const RoleSchema: z.ZodEnum<["PATIENT", "DOCTOR", "HOSPITAL"]>;
export type Role = z.infer<typeof RoleSchema>;
export declare const GenderSchema: z.ZodEnum<["MALE", "FEMALE", "OTHER"]>;
export type Gender = z.infer<typeof GenderSchema>;
export declare const AppointmentStatusSchema: z.ZodEnum<["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "TIMED_OUT"]>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;
export declare const AppointmentTypeSchema: z.ZodEnum<["IN_PERSON", "VIDEO"]>;
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;
export declare const BedTypeSchema: z.ZodEnum<["ICU", "GENERAL", "PREMIUM"]>;
export type BedType = z.infer<typeof BedTypeSchema>;
export declare const BLOOD_GROUPS: readonly ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export declare const BloodGroupSchema: z.ZodEnum<["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]>;
export type BloodGroup = z.infer<typeof BloodGroupSchema>;
/** Status values a patient's appointment may move to, keyed by current status. */
export declare const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]>;
/**
 * Every API response uses this shape — see docs/API_CONTRACT.md.
 * `data` is null on failure.
 */
export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T | null;
};
export declare const apiResponseSchema: <T extends z.ZodTypeAny>(data: T) => z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodNullable<T>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodNullable<T>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodNullable<T>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const idSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const isoDateSchema: z.ZodUnion<[z.ZodString, z.ZodString]>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};
//# sourceMappingURL=common.d.ts.map