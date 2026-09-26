"use server";

import { prisma, Gender } from "@upchaar/db";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import bcrypt from "bcryptjs";



export async function createPatient(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string | null;
  const dateOfBirth = new Date(formData.get("dateOfBirth") as string);
  const gender = formData.get("gender") as Gender;
  const bloodGroup = formData.get("bloodGroup") as string;

  if (!name || !phone || !dateOfBirth || !gender) {
    throw new Error("Missing required fields");
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const patient = await prisma.patient.create({
    data: {
      name,
      phone,
      email: email || null,
      dateOfBirth,
      gender,
      bloodGroup: bloodGroup || null,
      passwordHash,
    },
  });

  await prisma.healthWorkerPatientAssignment.create({
    data: {
      healthWorkerId: session.id,
      patientId: patient.id,
    },
  });

  revalidatePath("/patients");
  return patient;
}

export async function searchPatients(query: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!query || query.length < 3) return [];

  const assignments = await prisma.healthWorkerPatientAssignment.findMany({
    where: { healthWorkerId: session.id },
    select: { patientId: true }
  });
  const assignedPatientIds = assignments.map(a => a.patientId);

  return await prisma.patient.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ],
      id: { notIn: assignedPatientIds }
    },
    take: 5,
    select: {
      id: true,
      name: true,
      phone: true,
    }
  });
}

export async function assignPatient(patientId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.healthWorkerPatientAssignment.create({
    data: {
      healthWorkerId: session.id,
      patientId,
    },
  });

  revalidatePath("/patients");
}
