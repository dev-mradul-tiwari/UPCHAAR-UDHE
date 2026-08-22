import type {
  HospitalDetail,
  HospitalSearchQuery,
  HospitalStats,
  HospitalSummary,
  HospitalUpdateInput,
  Paginated,
} from "@upchaar/types";

import { Prisma, hospitalDetailInclude, hospitalSummaryInclude, prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { addDays, todayUtc } from "../utils/dates.js";
import { sumBeds, toHospitalDetail, toHospitalSummary } from "../utils/serializers.js";

const EXPIRY_WARNING_DAYS = 30;

export async function searchHospitals(
  query: HospitalSearchQuery,
): Promise<Paginated<HospitalSummary>> {
  const where: Prisma.HospitalWhereInput = {};

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { city: { contains: query.q, mode: "insensitive" } },
      { type: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.city) where.city = { contains: query.city, mode: "insensitive" };
  if (query.departmentId) where.departments = { some: { id: query.departmentId } };
  if (query.hasBeds) where.beds = { some: { available: { gt: 0 } } };

  const [rows, total] = await Promise.all([
    prisma.hospital.findMany({
      where,
      include: hospitalSummaryInclude,
      orderBy: [{ rating: "desc" }, { name: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.hospital.count({ where }),
  ]);

  return {
    items: rows.map(toHospitalSummary),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getHospitalDetail(hospitalId: string): Promise<HospitalDetail> {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    include: hospitalDetailInclude,
  });
  if (!hospital) throw ApiError.notFound("Hospital not found");
  return toHospitalDetail(hospital);
}

export async function updateHospital(
  hospitalId: string,
  input: HospitalUpdateInput,
): Promise<HospitalDetail> {
  const hospital = await prisma.hospital.update({
    where: { id: hospitalId },
    data: input,
    include: hospitalDetailInclude,
  });
  return toHospitalDetail(hospital);
}

export async function getHospitalStats(hospitalId: string): Promise<HospitalStats> {
  const day = todayUtc();
  const now = new Date();

  const [departments, todaysAppointments, beds, medicines, doctorCount] = await Promise.all([
    prisma.department.findMany({
      where: { hospitalId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: { hospitalId, scheduledDay: day },
      select: { departmentId: true, status: true },
    }),
    prisma.bedInventory.findMany({ where: { hospitalId } }),
    prisma.medicineInventory.findMany({
      where: { hospitalId },
      select: { quantity: true, threshold: true, expiryDate: true },
    }),
    prisma.doctor.count({ where: { hospitalId } }),
  ]);

  const bedTotals = sumBeds(beds);
  const occupied = bedTotals.total - bedTotals.available;
  const expiryCutoff = addDays(now, EXPIRY_WARNING_DAYS);

  const departmentLoad = departments.map((department) => {
    const forDepartment = todaysAppointments.filter(
      (appointment) => appointment.departmentId === department.id,
    );
    return {
      departmentId: department.id,
      departmentName: department.name,
      total: forDepartment.length,
      waiting: forDepartment.filter(
        (appointment) => appointment.status === "PENDING" || appointment.status === "CONFIRMED",
      ).length,
    };
  });

  return {
    appointmentsToday: todaysAppointments.length,
    pendingToday: todaysAppointments.filter((a) => a.status === "PENDING").length,
    completedToday: todaysAppointments.filter((a) => a.status === "COMPLETED").length,
    bedOccupancyPct: bedTotals.total > 0 ? Math.round((occupied / bedTotals.total) * 100) : 0,
    totalBeds: bedTotals.total,
    availableBeds: bedTotals.available,
    lowStockCount: medicines.filter((m) => m.quantity <= m.threshold).length,
    expiringSoonCount: medicines.filter((m) => m.expiryDate <= expiryCutoff).length,
    doctorCount,
    departmentLoad,
  };
}
