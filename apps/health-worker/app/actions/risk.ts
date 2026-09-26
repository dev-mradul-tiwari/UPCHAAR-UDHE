"use server";

import { prisma } from "@upchaar/db";
import { getSession } from "./auth";
import { redirect } from "next/navigation";



export async function flagHighRisk(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const patientId = formData.get("patientId") as string;
  const category = formData.get("category") as string;

  if (!patientId || !category) throw new Error("Missing required fields");

  await prisma.highRiskFlag.create({
    data: {
      patientId,
      healthWorkerId: session.id,
      category,
    }
  });

  redirect(`/patients/${patientId}`);
}
