import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Health Worker Data...");

  const passwordHash = bcrypt.hashSync("Password123!", 10);

  const asha = await prisma.healthWorker.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      name: "Sita Devi",
      phone: "9876543210",
      passwordHash,
      role: "ASHA",
      region: "Village Palampur",
    }
  });
  console.log("Created ASHA Worker:", asha.name);

  // Fetch some existing patients seeded by the main seed script
  const patients = await prisma.patient.findMany({ take: 2 });

  for (const patient of patients) {
    await prisma.healthWorkerPatientAssignment.upsert({
      where: {
        healthWorkerId_patientId: {
          healthWorkerId: asha.id,
          patientId: patient.id
        }
      },
      update: {},
      create: {
        healthWorkerId: asha.id,
        patientId: patient.id
      }
    });
  }
  console.log(`Assigned ${patients.length} patients to ASHA worker`);

  if (patients.length > 0) {
    await prisma.fieldVitals.create({
      data: {
        healthWorkerId: asha.id,
        patientId: patients[0].id,
        bloodPressureSystolic: 128,
        bloodPressureDiastolic: 82,
        temperature: 98.4,
        weight: 62.5,
        bloodSugar: 102
      }
    });

    await prisma.highRiskFlag.create({
      data: {
        healthWorkerId: asha.id,
        patientId: patients[0].id,
        category: "Pregnant"
      }
    });
    console.log("Seeded mock vitals and high-risk flags");
  }

  console.log("Health Worker seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
