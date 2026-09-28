import { z } from "zod";
import { AppointmentStatusSchema, AppointmentTypeSchema } from "./common.js";
export declare const departmentInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    headDoctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    avgConsultMinutes: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    avgConsultMinutes: number;
    description?: string | undefined;
    headDoctorId?: string | null | undefined;
}, {
    name: string;
    description?: string | undefined;
    headDoctorId?: string | null | undefined;
    avgConsultMinutes?: number | undefined;
}>;
export type DepartmentInput = z.infer<typeof departmentInputSchema>;
export declare const departmentUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    headDoctorId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    avgConsultMinutes: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    name?: string | undefined;
    headDoctorId?: string | null | undefined;
    avgConsultMinutes?: number | undefined;
}, {
    description?: string | undefined;
    name?: string | undefined;
    headDoctorId?: string | null | undefined;
    avgConsultMinutes?: number | undefined;
}>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
export type Department = {
    id: string;
    name: string;
    description: string | null;
    avgConsultMinutes: number;
    hospitalId: string;
    headDoctor: {
        id: string;
        name: string;
    } | null;
    doctorCount: number;
};
export declare const doctorCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    specialization: z.ZodString;
    experienceYears: z.ZodDefault<z.ZodNumber>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    phone: string;
    specialization: string;
    experienceYears: number;
    departmentId?: string | null | undefined;
}, {
    email: string;
    name: string;
    phone: string;
    specialization: string;
    experienceYears?: number | undefined;
    departmentId?: string | null | undefined;
}>;
export type DoctorCreateInput = z.infer<typeof doctorCreateSchema>;
export declare const doctorUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    specialization: z.ZodOptional<z.ZodString>;
    experienceYears: z.ZodOptional<z.ZodNumber>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isAvailable: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    specialization?: string | undefined;
    experienceYears?: number | undefined;
    departmentId?: string | null | undefined;
    isAvailable?: boolean | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    specialization?: string | undefined;
    experienceYears?: number | undefined;
    departmentId?: string | null | undefined;
    isAvailable?: boolean | undefined;
}>;
export type DoctorUpdateInput = z.infer<typeof doctorUpdateSchema>;
export declare const doctorSelfUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    specialization: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    specialization?: string | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    specialization?: string | undefined;
}>;
export type DoctorSelfUpdateInput = z.infer<typeof doctorSelfUpdateSchema>;
export declare const availabilitySchema: z.ZodObject<{
    isAvailable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isAvailable: boolean;
}, {
    isAvailable: boolean;
}>;
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
export declare const bookAppointmentSchema: z.ZodObject<{
    hospitalId: z.ZodString;
    departmentId: z.ZodString;
    doctorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reason: z.ZodString;
    scheduledFor: z.ZodEffects<z.ZodDate, Date, Date>;
    type: z.ZodDefault<z.ZodEnum<["IN_PERSON", "VIDEO"]>>;
    receiveSms: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "IN_PERSON" | "VIDEO";
    departmentId: string;
    hospitalId: string;
    reason: string;
    scheduledFor: Date;
    receiveSms: boolean;
    doctorId?: string | null | undefined;
}, {
    departmentId: string;
    hospitalId: string;
    reason: string;
    scheduledFor: Date;
    type?: "IN_PERSON" | "VIDEO" | undefined;
    doctorId?: string | null | undefined;
    receiveSms?: boolean | undefined;
}>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export declare const appointmentStatusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "TIMED_OUT"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "TIMED_OUT";
    notes?: string | undefined;
}, {
    status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "TIMED_OUT";
    notes?: string | undefined;
}>;
export type AppointmentStatusUpdateInput = z.infer<typeof appointmentStatusUpdateSchema>;
export declare const assignDoctorSchema: z.ZodObject<{
    doctorId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    doctorId: string;
}, {
    doctorId: string;
}>;
export type AssignDoctorInput = z.infer<typeof assignDoctorSchema>;
export declare const appointmentListQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "TIMED_OUT"]>>;
    date: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "TIMED_OUT" | undefined;
    date?: string | undefined;
    departmentId?: string | undefined;
}, {
    status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "TIMED_OUT" | undefined;
    date?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    departmentId?: string | undefined;
}>;
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
    patient: {
        id: string;
        name: string;
        phone: string;
    } | null;
    hospital: {
        id: string;
        name: string;
        city: string;
    } | null;
    department: {
        id: string;
        name: string;
    } | null;
    doctor: {
        id: string;
        name: string;
        specialization: string;
    } | null;
};
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
export declare const bedInputSchema: z.ZodObject<{
    beds: z.ZodArray<z.ZodEffects<z.ZodObject<{
        type: z.ZodEnum<["ICU", "GENERAL", "PREMIUM"]>;
        total: z.ZodNumber;
        available: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "ICU" | "GENERAL" | "PREMIUM";
        total: number;
        available: number;
    }, {
        type: "ICU" | "GENERAL" | "PREMIUM";
        total: number;
        available: number;
    }>, {
        type: "ICU" | "GENERAL" | "PREMIUM";
        total: number;
        available: number;
    }, {
        type: "ICU" | "GENERAL" | "PREMIUM";
        total: number;
        available: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    beds: {
        type: "ICU" | "GENERAL" | "PREMIUM";
        total: number;
        available: number;
    }[];
}, {
    beds: {
        type: "ICU" | "GENERAL" | "PREMIUM";
        total: number;
        available: number;
    }[];
}>;
export type BedInput = z.infer<typeof bedInputSchema>;
export declare const medicineInputSchema: z.ZodObject<{
    name: z.ZodString;
    quantity: z.ZodNumber;
    threshold: z.ZodDefault<z.ZodNumber>;
    unit: z.ZodDefault<z.ZodString>;
    expiryDate: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    quantity: number;
    threshold: number;
    unit: string;
    expiryDate: Date;
}, {
    name: string;
    quantity: number;
    expiryDate: Date;
    threshold?: number | undefined;
    unit?: string | undefined;
}>;
export type MedicineInput = z.infer<typeof medicineInputSchema>;
export declare const medicineUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    threshold: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    unit: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    expiryDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    quantity?: number | undefined;
    threshold?: number | undefined;
    unit?: string | undefined;
    expiryDate?: Date | undefined;
}, {
    name?: string | undefined;
    quantity?: number | undefined;
    threshold?: number | undefined;
    unit?: string | undefined;
    expiryDate?: Date | undefined;
}>;
export type MedicineUpdateInput = z.infer<typeof medicineUpdateSchema>;
export declare const inventoryQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    lowStock: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodBoolean, z.ZodEnum<["true", "false"]>]>, boolean, boolean | "true" | "false">>;
    expiringInDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    q?: string | undefined;
    lowStock?: boolean | undefined;
    expiringInDays?: number | undefined;
}, {
    q?: string | undefined;
    lowStock?: boolean | "true" | "false" | undefined;
    expiringInDays?: number | undefined;
}>;
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
export declare const medicalHistorySchema: z.ZodObject<{
    chronicDiseases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allergies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    pastSurgeries: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    currentMedications: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    smoking: z.ZodDefault<z.ZodBoolean>;
    alcohol: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    chronicDiseases: string[];
    allergies: string[];
    pastSurgeries: string[];
    currentMedications: string[];
    smoking: boolean;
    alcohol: boolean;
    notes?: string | null | undefined;
}, {
    chronicDiseases?: string[] | undefined;
    allergies?: string[] | undefined;
    pastSurgeries?: string[] | undefined;
    currentMedications?: string[] | undefined;
    smoking?: boolean | undefined;
    alcohol?: boolean | undefined;
    notes?: string | null | undefined;
}>;
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
export declare const createReferralSchema: z.ZodObject<{
    patientId: z.ZodString;
    reason: z.ZodString;
    targetSpecialization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    patientId: string;
    targetSpecialization?: string | null | undefined;
}, {
    reason: string;
    patientId: string;
    targetSpecialization?: string | null | undefined;
}>;
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
export declare const createFeedbackSchema: z.ZodObject<{
    appointmentId: z.ZodString;
    doctorRating: z.ZodNumber;
    hospitalRating: z.ZodNumber;
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    appointmentId: string;
    doctorRating: number;
    hospitalRating: number;
    comment?: string | null | undefined;
}, {
    appointmentId: string;
    doctorRating: number;
    hospitalRating: number;
    comment?: string | null | undefined;
}>;
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
//# sourceMappingURL=clinical.d.ts.map