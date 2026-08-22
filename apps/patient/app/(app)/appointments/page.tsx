import type { Metadata } from "next";

import { AppointmentsView } from "@/components/appointments/appointments-view";

export const metadata: Metadata = { title: "My appointments" };

export default function AppointmentsPage() {
  return <AppointmentsView />;
}
