/**
 * Demo seed for Upchaar.
 *
 * Creates 3 hospitals, 8 doctors, 5 patients, bed + medicine inventory and a
 * spread of appointments — including one department with a live queue so the
 * SSE queue screens have something real to show.
 *
 * Every account uses the same password so the demo is easy to drive:
 *   patients / hospitals -> Password123!
 *   doctors              -> Doctor123!   (mustChangePassword is false for these)
 *
 * Idempotent: wipes the tables it owns before inserting.
 */
import { PrismaClient, Gender, BedType, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USER_PASSWORD = "Password123!";
const DOCTOR_PASSWORD = "Doctor123!";

/** UTC midnight for a given date — matches Appointment.scheduledDay. */
function dayOf(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function at(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding Upchaar…");

  // Order matters: children first.
  await prisma.appointment.deleteMany();
  await prisma.medicineInventory.deleteMany();
  await prisma.bedInventory.deleteMany();
  await prisma.medicalHistory.deleteMany();
  // Detach head doctors so departments/doctors can be removed without cycles.
  await prisma.department.updateMany({ data: { headDoctorId: null } });
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.hospital.deleteMany();

  const userHash = await bcrypt.hash(USER_PASSWORD, 10);
  const doctorHash = await bcrypt.hash(DOCTOR_PASSWORD, 10);

  // ---------------------------------------------------------------- hospitals
  const hospitalSeeds = [
    {
      name: "Apollo City Hospital",
      email: "admin@apollocity.in",
      phone: "+91-9812340001",
      type: "Multi-speciality",
      registrationNumber: "MH-APL-100241",
      addressLine: "14 Marine Drive",
      city: "Mumbai",
      state: "Maharashtra",
      zipcode: "400020",
      rating: 4.6,
    },
    {
      name: "Sunrise Medical Centre",
      email: "admin@sunrisemed.in",
      phone: "+91-9812340002",
      type: "Multi-speciality",
      registrationNumber: "DL-SUN-330912",
      addressLine: "88 Connaught Circus",
      city: "New Delhi",
      state: "Delhi",
      zipcode: "110001",
      rating: 4.3,
    },
    {
      name: "Greenfield Care Clinic",
      email: "admin@greenfieldcare.in",
      phone: "+91-9812340003",
      type: "Clinic",
      registrationNumber: "KA-GRN-556710",
      addressLine: "5 Residency Road",
      city: "Bengaluru",
      state: "Karnataka",
      zipcode: "560025",
      rating: 4.1,
    },
  ];

  const hospitals = [];
  for (const h of hospitalSeeds) {
    hospitals.push(
      await prisma.hospital.create({ data: { ...h, passwordHash: userHash } }),
    );
  }
  const [apollo, sunrise, greenfield] = hospitals;
  if (!apollo || !sunrise || !greenfield) throw new Error("hospital seed failed");

  // -------------------------------------------------------------- departments
  const deptNames = [
    { name: "Cardiology", description: "Heart and vascular care", avgConsultMinutes: 20 },
    { name: "Orthopaedics", description: "Bones, joints and spine", avgConsultMinutes: 15 },
    { name: "Paediatrics", description: "Child health", avgConsultMinutes: 12 },
    { name: "General Medicine", description: "Primary consultation", avgConsultMinutes: 10 },
  ];

  const deptsByHospital = new Map<string, { id: string; name: string }[]>();
  for (const hospital of hospitals) {
    const created = [];
    for (const d of deptNames) {
      created.push(
        await prisma.department.create({
          data: { ...d, hospitalId: hospital.id },
          select: { id: true, name: true },
        }),
      );
    }
    deptsByHospital.set(hospital.id, created);
  }

  const apolloDepts = deptsByHospital.get(apollo.id)!;
  const sunriseDepts = deptsByHospital.get(sunrise.id)!;
  const greenfieldDepts = deptsByHospital.get(greenfield.id)!;

  const deptId = (list: { id: string; name: string }[], name: string): string => {
    const found = list.find((d) => d.name === name);
    if (!found) throw new Error(`department ${name} missing`);
    return found.id;
  };

  // ------------------------------------------------------------------ doctors
  const doctorSeeds = [
    { name: "Dr. Aarti Deshmukh", email: "aarti.deshmukh@apollocity.in", specialization: "Interventional Cardiology", experienceYears: 14, hospitalId: apollo.id, departmentId: deptId(apolloDepts, "Cardiology") },
    { name: "Dr. Rohan Mehta", email: "rohan.mehta@apollocity.in", specialization: "Orthopaedic Surgery", experienceYears: 9, hospitalId: apollo.id, departmentId: deptId(apolloDepts, "Orthopaedics") },
    { name: "Dr. Neha Kulkarni", email: "neha.kulkarni@apollocity.in", specialization: "Paediatrics", experienceYears: 7, hospitalId: apollo.id, departmentId: deptId(apolloDepts, "Paediatrics") },
    { name: "Dr. Imran Sheikh", email: "imran.sheikh@apollocity.in", specialization: "Internal Medicine", experienceYears: 11, hospitalId: apollo.id, departmentId: deptId(apolloDepts, "General Medicine") },
    { name: "Dr. Priya Nair", email: "priya.nair@sunrisemed.in", specialization: "Cardiology", experienceYears: 12, hospitalId: sunrise.id, departmentId: deptId(sunriseDepts, "Cardiology") },
    { name: "Dr. Vikram Singh", email: "vikram.singh@sunrisemed.in", specialization: "Orthopaedics", experienceYears: 6, hospitalId: sunrise.id, departmentId: deptId(sunriseDepts, "Orthopaedics") },
    { name: "Dr. Ananya Rao", email: "ananya.rao@greenfieldcare.in", specialization: "General Medicine", experienceYears: 5, hospitalId: greenfield.id, departmentId: deptId(greenfieldDepts, "General Medicine") },
    { name: "Dr. Karthik Iyer", email: "karthik.iyer@greenfieldcare.in", specialization: "Paediatrics", experienceYears: 8, hospitalId: greenfield.id, departmentId: deptId(greenfieldDepts, "Paediatrics") },
  ];

  const doctors = [];
  for (const d of doctorSeeds) {
    doctors.push(
      await prisma.doctor.create({
        data: {
          ...d,
          phone: "+91-98000" + String(10000 + doctors.length),
          passwordHash: doctorHash,
          mustChangePassword: false,
          isAvailable: true,
        },
      }),
    );
  }

  // Head doctors: first doctor of each department that has one.
  for (const doc of doctors) {
    if (!doc.departmentId) continue;
    const dept = await prisma.department.findUnique({
      where: { id: doc.departmentId },
      select: { headDoctorId: true },
    });
    if (dept && dept.headDoctorId === null) {
      await prisma.department.update({
        where: { id: doc.departmentId },
        data: { headDoctorId: doc.id },
      });
    }
  }

  // ----------------------------------------------------------------- patients
  const patientSeeds = [
    { name: "Mradul Tiwari", email: "mradul@example.com", phone: "+91-9900011122", dateOfBirth: new Date("1998-04-12"), gender: Gender.MALE, bloodGroup: "O+" },
    { name: "Sneha Verma", email: "sneha@example.com", phone: "+91-9900011133", dateOfBirth: new Date("1992-09-30"), gender: Gender.FEMALE, bloodGroup: "A+" },
    { name: "Rajesh Kumar", email: "rajesh@example.com", phone: "+91-9900011144", dateOfBirth: new Date("1975-01-22"), gender: Gender.MALE, bloodGroup: "B+" },
    { name: "Fatima Ansari", email: "fatima@example.com", phone: "+91-9900011155", dateOfBirth: new Date("2001-07-08"), gender: Gender.FEMALE, bloodGroup: "AB-" },
    { name: "Arjun Pillai", email: "arjun@example.com", phone: "+91-9900011166", dateOfBirth: new Date("1988-12-02"), gender: Gender.MALE, bloodGroup: "O-" },
  ];

  const histories = [
    { chronicDiseases: ["Asthma"], allergies: ["Penicillin", "Dust"], pastSurgeries: [], currentMedications: ["Salbutamol inhaler"], smoking: false, alcohol: false, notes: "Uses inhaler during seasonal flare-ups." },
    { chronicDiseases: ["Hypothyroidism"], allergies: [], pastSurgeries: ["Appendectomy (2016)"], currentMedications: ["Levothyroxine 50mcg"], smoking: false, alcohol: true, notes: null },
    { chronicDiseases: ["Type 2 Diabetes", "Hypertension"], allergies: ["Sulfa drugs"], pastSurgeries: ["Angioplasty (2021)"], currentMedications: ["Metformin 500mg", "Amlodipine 5mg"], smoking: true, alcohol: true, notes: "Blood sugar reviewed quarterly." },
    { chronicDiseases: [], allergies: ["Peanuts"], pastSurgeries: [], currentMedications: [], smoking: false, alcohol: false, notes: null },
    { chronicDiseases: ["Migraine"], allergies: [], pastSurgeries: ["ACL reconstruction (2019)"], currentMedications: ["Sumatriptan (as needed)"], smoking: false, alcohol: true, notes: "Migraine triggered by irregular sleep." },
  ];

  const patients = [];
  for (let i = 0; i < patientSeeds.length; i++) {
    const p = patientSeeds[i]!;
    const h = histories[i]!;
    patients.push(
      await prisma.patient.create({
        data: {
          ...p,
          passwordHash: userHash,
          medicalHistory: { create: h },
        },
      }),
    );
  }

  // --------------------------------------------------------------------- beds
  const bedPlan: Record<string, { type: BedType; total: number; available: number }[]> = {
    [apollo.id]: [
      { type: BedType.ICU, total: 40, available: 6 },
      { type: BedType.GENERAL, total: 220, available: 74 },
      { type: BedType.PREMIUM, total: 60, available: 21 },
    ],
    [sunrise.id]: [
      { type: BedType.ICU, total: 25, available: 2 },
      { type: BedType.GENERAL, total: 150, available: 48 },
      { type: BedType.PREMIUM, total: 30, available: 11 },
    ],
    [greenfield.id]: [
      { type: BedType.ICU, total: 8, available: 3 },
      { type: BedType.GENERAL, total: 45, available: 19 },
      { type: BedType.PREMIUM, total: 10, available: 5 },
    ],
  };
  for (const [hospitalId, rows] of Object.entries(bedPlan)) {
    for (const row of rows) {
      await prisma.bedInventory.create({ data: { hospitalId, ...row } });
    }
  }

  // ---------------------------------------------------------------- medicines
  const soon = (days: number) => new Date(Date.now() + days * 86_400_000);
  const medicines = [
    { hospitalId: apollo.id, name: "Paracetamol 500mg", quantity: 1200, threshold: 200, unit: "tablets", expiryDate: soon(400) },
    { hospitalId: apollo.id, name: "Amoxicillin 250mg", quantity: 80, threshold: 150, unit: "capsules", expiryDate: soon(180) },
    { hospitalId: apollo.id, name: "Insulin Glargine", quantity: 14, threshold: 25, unit: "vials", expiryDate: soon(21) },
    { hospitalId: apollo.id, name: "Atorvastatin 20mg", quantity: 640, threshold: 100, unit: "tablets", expiryDate: soon(300) },
    { hospitalId: apollo.id, name: "Normal Saline 500ml", quantity: 300, threshold: 80, unit: "bottles", expiryDate: soon(240) },
    { hospitalId: sunrise.id, name: "Paracetamol 500mg", quantity: 540, threshold: 200, unit: "tablets", expiryDate: soon(365) },
    { hospitalId: sunrise.id, name: "Metformin 500mg", quantity: 45, threshold: 120, unit: "tablets", expiryDate: soon(150) },
    { hospitalId: sunrise.id, name: "Salbutamol Inhaler", quantity: 26, threshold: 20, unit: "units", expiryDate: soon(12) },
    { hospitalId: sunrise.id, name: "Ceftriaxone 1g", quantity: 110, threshold: 40, unit: "vials", expiryDate: soon(210) },
    { hospitalId: sunrise.id, name: "Ibuprofen 400mg", quantity: 900, threshold: 150, unit: "tablets", expiryDate: soon(330) },
    { hospitalId: greenfield.id, name: "Paracetamol 500mg", quantity: 210, threshold: 100, unit: "tablets", expiryDate: soon(280) },
    { hospitalId: greenfield.id, name: "ORS Sachets", quantity: 18, threshold: 60, unit: "sachets", expiryDate: soon(95) },
    { hospitalId: greenfield.id, name: "Azithromycin 500mg", quantity: 75, threshold: 50, unit: "tablets", expiryDate: soon(45) },
    { hospitalId: greenfield.id, name: "Cetirizine 10mg", quantity: 430, threshold: 80, unit: "tablets", expiryDate: soon(500) },
    { hospitalId: greenfield.id, name: "Povidone Iodine 100ml", quantity: 9, threshold: 15, unit: "bottles", expiryDate: soon(30) },
  ];
  for (const m of medicines) await prisma.medicineInventory.create({ data: m });

  // ------------------------------------------------------------- appointments
  const today = dayOf(new Date());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const cardio = deptId(apolloDepts, "Cardiology");
  const ortho = deptId(apolloDepts, "Orthopaedics");
  const genMed = deptId(apolloDepts, "General Medicine");
  const sunriseCardio = deptId(sunriseDepts, "Cardiology");

  const drAarti = doctors.find((d) => d.email === "aarti.deshmukh@apollocity.in")!;
  const drRohan = doctors.find((d) => d.email === "rohan.mehta@apollocity.in")!;
  const drImran = doctors.find((d) => d.email === "imran.sheikh@apollocity.in")!;
  const drPriya = doctors.find((d) => d.email === "priya.nair@sunrisemed.in")!;

  type ApptSeed = {
    reason: string;
    status: AppointmentStatus;
    scheduledFor: Date;
    scheduledDay: Date;
    queueNumber: number;
    patientId: string;
    hospitalId: string;
    departmentId: string;
    doctorId?: string;
    startedAt?: Date;
    completedAt?: Date;
  };

  const appts: ApptSeed[] = [
    // Apollo / Cardiology today — the live queue. #1 in progress, 2-4 waiting.
    { reason: "Chest tightness while climbing stairs", status: AppointmentStatus.IN_PROGRESS, scheduledFor: at(today, 9, 0), scheduledDay: today, queueNumber: 1, patientId: patients[2]!.id, hospitalId: apollo.id, departmentId: cardio, doctorId: drAarti.id, startedAt: at(today, 9, 5) },
    { reason: "Follow-up after angioplasty", status: AppointmentStatus.CONFIRMED, scheduledFor: at(today, 9, 30), scheduledDay: today, queueNumber: 2, patientId: patients[0]!.id, hospitalId: apollo.id, departmentId: cardio, doctorId: drAarti.id },
    { reason: "Palpitations at night", status: AppointmentStatus.CONFIRMED, scheduledFor: at(today, 10, 0), scheduledDay: today, queueNumber: 3, patientId: patients[1]!.id, hospitalId: apollo.id, departmentId: cardio, doctorId: drAarti.id },
    { reason: "High blood pressure review", status: AppointmentStatus.CONFIRMED, scheduledFor: at(today, 10, 30), scheduledDay: today, queueNumber: 4, patientId: patients[4]!.id, hospitalId: apollo.id, departmentId: cardio, doctorId: drAarti.id },
    { reason: "Routine ECG", status: AppointmentStatus.PENDING, scheduledFor: at(today, 11, 0), scheduledDay: today, queueNumber: 5, patientId: patients[3]!.id, hospitalId: apollo.id, departmentId: cardio },
    // Apollo / Orthopaedics today
    { reason: "Knee pain after running", status: AppointmentStatus.COMPLETED, scheduledFor: at(today, 9, 0), scheduledDay: today, queueNumber: 1, patientId: patients[4]!.id, hospitalId: apollo.id, departmentId: ortho, doctorId: drRohan.id, startedAt: at(today, 9, 2), completedAt: at(today, 9, 18) },
    { reason: "Lower back stiffness", status: AppointmentStatus.CONFIRMED, scheduledFor: at(today, 9, 45), scheduledDay: today, queueNumber: 2, patientId: patients[1]!.id, hospitalId: apollo.id, departmentId: ortho, doctorId: drRohan.id },
    { reason: "Shoulder physiotherapy review", status: AppointmentStatus.PENDING, scheduledFor: at(today, 10, 15), scheduledDay: today, queueNumber: 3, patientId: patients[2]!.id, hospitalId: apollo.id, departmentId: ortho },
    // Apollo / General Medicine today
    { reason: "Persistent cough for two weeks", status: AppointmentStatus.CONFIRMED, scheduledFor: at(today, 11, 0), scheduledDay: today, queueNumber: 1, patientId: patients[3]!.id, hospitalId: apollo.id, departmentId: genMed, doctorId: drImran.id },
    { reason: "Annual health check", status: AppointmentStatus.PENDING, scheduledFor: at(today, 11, 30), scheduledDay: today, queueNumber: 2, patientId: patients[0]!.id, hospitalId: apollo.id, departmentId: genMed },
    // Sunrise / Cardiology today
    { reason: "Second opinion on ECG report", status: AppointmentStatus.CONFIRMED, scheduledFor: at(today, 12, 0), scheduledDay: today, queueNumber: 1, patientId: patients[0]!.id, hospitalId: sunrise.id, departmentId: sunriseCardio, doctorId: drPriya.id },
    { reason: "Cholesterol management", status: AppointmentStatus.PENDING, scheduledFor: at(today, 12, 30), scheduledDay: today, queueNumber: 2, patientId: patients[2]!.id, hospitalId: sunrise.id, departmentId: sunriseCardio },
    // Yesterday — history
    { reason: "Fever and body ache", status: AppointmentStatus.COMPLETED, scheduledFor: at(yesterday, 10, 0), scheduledDay: yesterday, queueNumber: 1, patientId: patients[0]!.id, hospitalId: apollo.id, departmentId: genMed, doctorId: drImran.id, startedAt: at(yesterday, 10, 3), completedAt: at(yesterday, 10, 16) },
    { reason: "Sprained ankle", status: AppointmentStatus.COMPLETED, scheduledFor: at(yesterday, 11, 0), scheduledDay: yesterday, queueNumber: 1, patientId: patients[3]!.id, hospitalId: apollo.id, departmentId: ortho, doctorId: drRohan.id, startedAt: at(yesterday, 11, 4), completedAt: at(yesterday, 11, 22) },
    { reason: "Chest pain evaluation", status: AppointmentStatus.CANCELLED, scheduledFor: at(yesterday, 14, 0), scheduledDay: yesterday, queueNumber: 1, patientId: patients[1]!.id, hospitalId: apollo.id, departmentId: cardio },
    { reason: "Diabetes review", status: AppointmentStatus.COMPLETED, scheduledFor: at(yesterday, 15, 0), scheduledDay: yesterday, queueNumber: 1, patientId: patients[2]!.id, hospitalId: sunrise.id, departmentId: sunriseCardio, doctorId: drPriya.id, startedAt: at(yesterday, 15, 1), completedAt: at(yesterday, 15, 20) },
    // Tomorrow — upcoming
    { reason: "Echo test consultation", status: AppointmentStatus.CONFIRMED, scheduledFor: at(tomorrow, 9, 30), scheduledDay: tomorrow, queueNumber: 1, patientId: patients[0]!.id, hospitalId: apollo.id, departmentId: cardio, doctorId: drAarti.id },
    { reason: "Post-surgery follow-up", status: AppointmentStatus.CONFIRMED, scheduledFor: at(tomorrow, 10, 0), scheduledDay: tomorrow, queueNumber: 1, patientId: patients[4]!.id, hospitalId: apollo.id, departmentId: ortho, doctorId: drRohan.id },
    { reason: "Thyroid profile discussion", status: AppointmentStatus.PENDING, scheduledFor: at(tomorrow, 11, 0), scheduledDay: tomorrow, queueNumber: 1, patientId: patients[1]!.id, hospitalId: apollo.id, departmentId: genMed },
    { reason: "Child vaccination schedule", status: AppointmentStatus.PENDING, scheduledFor: at(tomorrow, 12, 0), scheduledDay: tomorrow, queueNumber: 1, patientId: patients[3]!.id, hospitalId: greenfield.id, departmentId: deptId(greenfieldDepts, "Paediatrics") },
  ];

  for (const a of appts) await prisma.appointment.create({ data: a });

  console.log(
    [
      "",
      "  Seed complete:",
      `    hospitals    ${hospitals.length}`,
      `    departments  ${hospitals.length * deptNames.length}`,
      `    doctors      ${doctors.length}`,
      `    patients     ${patients.length}`,
      `    medicines    ${medicines.length}`,
      `    appointments ${appts.length}`,
      "",
      "  Demo logins",
      `    patient   mradul@example.com            / ${USER_PASSWORD}`,
      `    hospital  admin@apollocity.in           / ${USER_PASSWORD}`,
      `    doctor    aarti.deshmukh@apollocity.in  / ${DOCTOR_PASSWORD}`,
      "",
      "  Live queue: Apollo City Hospital -> Cardiology -> today",
      "",
    ].join("\n"),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
