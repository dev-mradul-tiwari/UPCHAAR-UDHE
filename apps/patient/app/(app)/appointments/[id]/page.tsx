import type { Metadata } from "next";

import { AppointmentDetailView } from "@/components/appointments/appointment-detail-view";

export const metadata: Metadata = { title: "Live queue" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentDetailView appointmentId={id} />;
}
