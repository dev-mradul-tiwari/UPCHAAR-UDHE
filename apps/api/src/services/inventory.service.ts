import type {
  BedInput,
  BedSummary,
  InventoryQuery,
  Medicine,
  MedicineInput,
  MedicineUpdateInput,
} from "@upchaar/types";

import { Prisma, prisma } from "../lib/db.js";
import { ApiError } from "../utils/api-error.js";
import { addDays } from "../utils/dates.js";
import { toBedSummaries, toMedicine } from "../utils/serializers.js";

/* ------------------------------------------------------------------ beds */

export async function listBeds(hospitalId: string): Promise<BedSummary[]> {
  const beds = await prisma.bedInventory.findMany({
    where: { hospitalId },
    orderBy: { type: "asc" },
  });
  return toBedSummaries(beds);
}

/** Upsert every bed type supplied, in one transaction. */
export async function upsertBeds(hospitalId: string, input: BedInput): Promise<BedSummary[]> {
  await prisma.$transaction(
    input.beds.map((bed) =>
      prisma.bedInventory.upsert({
        where: { hospitalId_type: { hospitalId, type: bed.type } },
        create: { hospitalId, type: bed.type, total: bed.total, available: bed.available },
        update: { total: bed.total, available: bed.available },
      }),
    ),
  );
  return listBeds(hospitalId);
}

/* ------------------------------------------------------------- medicines */

async function assertOwnedMedicine(medicineId: string, hospitalId: string): Promise<void> {
  const medicine = await prisma.medicineInventory.findUnique({
    where: { id: medicineId },
    select: { hospitalId: true },
  });
  if (!medicine) throw ApiError.notFound("Medicine not found");
  if (medicine.hospitalId !== hospitalId) {
    throw ApiError.forbidden("That medicine belongs to another hospital");
  }
}

export async function listMedicines(
  hospitalId: string,
  query: InventoryQuery,
): Promise<Medicine[]> {
  const where: Prisma.MedicineInventoryWhereInput = { hospitalId };
  if (query.q) where.name = { contains: query.q, mode: "insensitive" };
  if (query.expiringInDays !== undefined) {
    where.expiryDate = { lte: addDays(new Date(), query.expiringInDays) };
  }

  const medicines = await prisma.medicineInventory.findMany({
    where,
    orderBy: [{ expiryDate: "asc" }, { name: "asc" }],
  });

  const now = new Date();
  const mapped = medicines.map((medicine) => toMedicine(medicine, now));
  // `quantity <= threshold` compares two columns, so it is applied in memory.
  return query.lowStock ? mapped.filter((medicine) => medicine.isLowStock) : mapped;
}

export async function createMedicine(
  hospitalId: string,
  input: MedicineInput,
): Promise<Medicine> {
  const medicine = await prisma.medicineInventory.create({
    data: {
      hospitalId,
      name: input.name,
      quantity: input.quantity,
      threshold: input.threshold,
      unit: input.unit,
      expiryDate: input.expiryDate,
    },
  });
  return toMedicine(medicine);
}

export async function updateMedicine(
  hospitalId: string,
  medicineId: string,
  input: MedicineUpdateInput,
): Promise<Medicine> {
  await assertOwnedMedicine(medicineId, hospitalId);

  const data: Prisma.MedicineInventoryUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.quantity !== undefined) data.quantity = input.quantity;
  if (input.threshold !== undefined) data.threshold = input.threshold;
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.expiryDate !== undefined) data.expiryDate = input.expiryDate;

  const medicine = await prisma.medicineInventory.update({
    where: { id: medicineId },
    data,
  });
  return toMedicine(medicine);
}

export async function deleteMedicine(
  hospitalId: string,
  medicineId: string,
): Promise<{ id: string }> {
  await assertOwnedMedicine(medicineId, hospitalId);
  await prisma.medicineInventory.delete({ where: { id: medicineId } });
  return { id: medicineId };
}
