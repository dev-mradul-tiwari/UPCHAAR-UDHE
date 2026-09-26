import { z } from "zod";
import {
  BloodGroupSchema,
  GenderSchema,
  RoleSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
} from "./common.js";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* --------------------------------------------------------------- patient */

export const patientRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: emailSchema.optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  password: passwordSchema,
  phone: phoneSchema,
  dateOfBirth: z.coerce.date().refine((d) => d < new Date(), {
    message: "Date of birth must be in the past",
  }),
  gender: GenderSchema,
  bloodGroup: BloodGroupSchema.optional(),
  medicalHistory: z
    .object({
      chronicDiseases: z.array(z.string().trim().min(1)).default([]),
      allergies: z.array(z.string().trim().min(1)).default([]),
      pastSurgeries: z.array(z.string().trim().min(1)).default([]),
      currentMedications: z.array(z.string().trim().min(1)).default([]),
      smoking: z.boolean().default(false),
      alcohol: z.boolean().default(false),
      notes: z.string().trim().max(1000).optional(),
    })
    .optional(),
});
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

/* -------------------------------------------------------------- hospital */

export const hospitalRegisterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  type: z.string().trim().min(2).max(60),
  registrationNumber: z.string().trim().min(3).max(60),
  addressLine: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  zipcode: z.string().trim().min(4).max(12),
});
export type HospitalRegisterInput = z.infer<typeof hospitalRegisterSchema>;

/* ---------------------------------------------------------------- doctor */

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* -------------------------------------------------------------- sessions */

export type JwtPayload = {
  sub: string;
  role: z.infer<typeof RoleSchema>;
  hospitalId?: string;
};

export type AuthenticatedUser = JwtPayload;
