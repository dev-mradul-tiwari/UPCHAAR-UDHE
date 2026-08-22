import type { Metadata } from "next";

import { HospitalDetailView } from "@/components/hospitals/hospital-detail-view";

export const metadata: Metadata = { title: "Hospital" };

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HospitalDetailView hospitalId={id} />;
}
