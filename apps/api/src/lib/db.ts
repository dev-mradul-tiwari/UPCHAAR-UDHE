import { Prisma, prisma } from "@upchaar/db";

export { Prisma, prisma };

/* ------------------------------------------------------------------ shapes */

export const appointmentInclude = {
  patient: { select: { id: true, name: true, phone: true } },
  hospital: { select: { id: true, name: true, city: true } },
  department: { select: { id: true, name: true } },
  doctor: { select: { id: true, name: true, specialization: true } },
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export const doctorInclude = {
  hospital: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.DoctorInclude;

export type DoctorWithRelations = Prisma.DoctorGetPayload<{
  include: typeof doctorInclude;
}>;

export const departmentInclude = {
  headDoctor: { select: { id: true, name: true } },
  _count: { select: { doctors: true } },
} satisfies Prisma.DepartmentInclude;

export type DepartmentWithRelations = Prisma.DepartmentGetPayload<{
  include: typeof departmentInclude;
}>;

export const hospitalSummaryInclude = {
  beds: true,
  _count: { select: { departments: true, doctors: true } },
} satisfies Prisma.HospitalInclude;

export type HospitalWithSummary = Prisma.HospitalGetPayload<{
  include: typeof hospitalSummaryInclude;
}>;

export const hospitalDetailInclude = {
  beds: true,
  _count: { select: { departments: true, doctors: true } },
  departments: {
    orderBy: { name: "asc" },
    include: {
      headDoctor: { select: { id: true, name: true } },
      _count: { select: { doctors: true } },
    },
  },
  doctors: {
    orderBy: { name: "asc" },
    include: { department: { select: { id: true, name: true } } },
  },
} satisfies Prisma.HospitalInclude;

export type HospitalWithDetail = Prisma.HospitalGetPayload<{
  include: typeof hospitalDetailInclude;
}>;

export const patientRecordInclude = {
  medicalHistory: true,
} satisfies Prisma.PatientInclude;

export type PatientWithHistory = Prisma.PatientGetPayload<{
  include: typeof patientRecordInclude;
}>;

/* ------------------------------------------------------------- error codes */

export function isPrismaKnownError(
  error: unknown,
  code: string,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
