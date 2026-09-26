"use server";

import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export async function bookAppointmentOnBehalf(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const hospitalId = formData.get("hospitalId") as string;
  const departmentId = formData.get("departmentId") as string;
  const scheduledFor = formData.get("scheduledFor") as string;
  const reason = formData.get("reason") as string;

  if (!patientId || !hospitalId || !departmentId || !scheduledFor) {
    throw new Error("Missing required fields");
  }

  // 1. Masquerade as the Patient to hit the existing API
  const token = jwt.sign(
    { role: "PATIENT" },
    process.env.JWT_SECRET || "supersecret", 
    { subject: patientId, expiresIn: "1h" }
  );

  // 2. Call the existing Appointment API
  const res = await fetch("http://localhost:4000/api/v1/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      hospitalId,
      departmentId,
      scheduledFor: new Date(scheduledFor).toISOString(),
      reason: reason || "Routine checkup via Health Worker",
      receiveSms: true
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to book appointment");
  }

  redirect(`/patients/${patientId}?booked=true`);
}
