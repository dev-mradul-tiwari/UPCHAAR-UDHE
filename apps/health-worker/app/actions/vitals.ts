"use server";

import { prisma } from "@upchaar/db";
import { getSession } from "./auth";
import { redirect } from "next/navigation";



export async function recordVitals(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const patientId = formData.get("patientId") as string;
  const sys = formData.get("sys") as string;
  const dia = formData.get("dia") as string;
  const temp = formData.get("temp") as string;
  const weight = formData.get("weight") as string;
  const sugar = formData.get("sugar") as string;

  if (!patientId) throw new Error("Missing patient ID");

  await prisma.fieldVitals.create({
    data: {
      patientId,
      healthWorkerId: session.id,
      bloodPressureSystolic: sys ? parseInt(sys) : null,
      bloodPressureDiastolic: dia ? parseInt(dia) : null,
      temperature: temp ? parseFloat(temp) : null,
      weight: weight ? parseFloat(weight) : null,
      bloodSugar: sugar ? parseFloat(sugar) : null,
    }
  });

  redirect(`/patients/${patientId}`);
}
