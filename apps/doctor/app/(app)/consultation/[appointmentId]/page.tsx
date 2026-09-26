import type { Metadata } from "next";
import { VideoConsultationView } from "@/components/VideoConsultationView";

export const metadata: Metadata = { title: "Video Consultation" };

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  return <VideoConsultationView appointmentId={appointmentId} />;
}
