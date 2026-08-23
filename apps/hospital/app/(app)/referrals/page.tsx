import type { Metadata } from "next";

import { HospitalReferralsContent } from "@/components/referrals/content";

export const metadata: Metadata = {
  title: "Referred Patients",
};

export default function HospitalReferralsPage() {
  return <HospitalReferralsContent />;
}
