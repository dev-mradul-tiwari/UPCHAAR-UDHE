import { redirect } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getSessionToken } from "@/lib/session.server";
import type { Appointment, Paginated } from "@upchaar/types";

export default async function ConsultationRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  const token = await getSessionToken();

  let activeAppointmentId: string | null = null;
  try {
    const result = await apiRequest<Paginated<Appointment>>("/appointments", {
      query: { status: "IN_PROGRESS", limit: 20 },
      token,
    });
    // Filter for this specific patient (API returns all IN_PROGRESS for the doctor's hospital)
    const match = result.items.find((a) => a.patient?.id === patientId) ?? null;
    activeAppointmentId = match?.id ?? null;
  } catch {
    // If the API call fails (e.g. no token), fall through and show the error UI.
  }

  if (activeAppointmentId) {
    redirect(`/consultation/${activeAppointmentId}`);
  }

  return (
    <div className="p-8 text-center text-red-500">
      <p className="font-bold">No active appointment</p>
    </div>
  );
}
