import { z } from "zod";
import { GenderSchema, RoleSchema } from "./common.js";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const patientRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEffects<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>, string | undefined, string | undefined>;
    password: z.ZodString;
    phone: z.ZodString;
    dateOfBirth: z.ZodEffects<z.ZodDate, Date, Date>;
    gender: z.ZodEnum<["MALE", "FEMALE", "OTHER"]>;
    bloodGroup: z.ZodOptional<z.ZodEnum<["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]>>;
    medicalHistory: z.ZodOptional<z.ZodObject<{
        chronicDiseases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allergies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        pastSurgeries: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        currentMedications: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        smoking: z.ZodDefault<z.ZodBoolean>;
        alcohol: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        chronicDiseases: string[];
        allergies: string[];
        pastSurgeries: string[];
        currentMedications: string[];
        smoking: boolean;
        alcohol: boolean;
        notes?: string | undefined;
    }, {
        chronicDiseases?: string[] | undefined;
        allergies?: string[] | undefined;
        pastSurgeries?: string[] | undefined;
        currentMedications?: string[] | undefined;
        smoking?: boolean | undefined;
        alcohol?: boolean | undefined;
        notes?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    name: string;
    phone: string;
    dateOfBirth: Date;
    gender: "MALE" | "FEMALE" | "OTHER";
    email?: string | undefined;
    bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
    medicalHistory?: {
        chronicDiseases: string[];
        allergies: string[];
        pastSurgeries: string[];
        currentMedications: string[];
        smoking: boolean;
        alcohol: boolean;
        notes?: string | undefined;
    } | undefined;
}, {
    password: string;
    name: string;
    phone: string;
    dateOfBirth: Date;
    gender: "MALE" | "FEMALE" | "OTHER";
    email?: string | undefined;
    bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
    medicalHistory?: {
        chronicDiseases?: string[] | undefined;
        allergies?: string[] | undefined;
        pastSurgeries?: string[] | undefined;
        currentMedications?: string[] | undefined;
        smoking?: boolean | undefined;
        alcohol?: boolean | undefined;
        notes?: string | undefined;
    } | undefined;
}>;
export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>;
export type PatientProfile = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    dateOfBirth: string;
    gender: z.infer<typeof GenderSchema>;
    bloodGroup: string | null;
    createdAt: string;
};
export declare const hospitalRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
    type: z.ZodString;
    registrationNumber: z.ZodString;
    addressLine: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipcode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    registrationNumber: string;
    addressLine: string;
    city: string;
    state: string;
    zipcode: string;
}, {
    type: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    registrationNumber: string;
    addressLine: string;
    city: string;
    state: string;
    zipcode: string;
}>;
export type HospitalRegisterInput = z.infer<typeof hospitalRegisterSchema>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type JwtPayload = {
    sub: string;
    role: z.infer<typeof RoleSchema>;
    hospitalId?: string;
};
export type AuthenticatedUser = JwtPayload;
//# sourceMappingURL=auth.d.ts.map