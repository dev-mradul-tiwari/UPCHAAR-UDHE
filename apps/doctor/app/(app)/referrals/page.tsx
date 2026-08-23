import type { Metadata } from "next";

import { DoctorReferralsContent } from "@/components/referrals/content";

export const metadata: Metadata = {
  title: "Referred Patients",
};

export default function DoctorReferralsPage() {
  return <DoctorReferralsContent />;
}
