import { z } from "zod";
import { BedTypeSchema } from "./common.js";
export declare const hospitalSearchQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    hasBeds: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodBoolean, z.ZodEnum<["true", "false"]>]>, boolean, boolean | "true" | "false">>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    city?: string | undefined;
    departmentId?: string | undefined;
    q?: string | undefined;
    hasBeds?: boolean | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    city?: string | undefined;
    departmentId?: string | undefined;
    q?: string | undefined;
    hasBeds?: boolean | "true" | "false" | undefined;
}>;
export type HospitalSearchQuery = z.infer<typeof hospitalSearchQuerySchema>;
export declare const hospitalUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    addressLine: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    zipcode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    addressLine?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zipcode?: string | undefined;
}, {
    type?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    addressLine?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zipcode?: string | undefined;
}>;
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
        headDoctor: {
            id: string;
            name: string;
        } | null;
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
//# sourceMappingURL=hospital.d.ts.map