import type { Metadata } from "next";

import { HospitalSearch } from "@/components/hospitals/hospital-search";

export const metadata: Metadata = { title: "Find care" };

export default function HospitalsPage() {
  return <HospitalSearch />;
}
