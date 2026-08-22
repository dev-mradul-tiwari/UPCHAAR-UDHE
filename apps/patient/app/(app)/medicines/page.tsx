import type { Metadata } from "next";

import { InteractionChecker } from "@/components/medicines/interaction-checker";

export const metadata: Metadata = { title: "Medicine check" };

export default function MedicinesPage() {
  return <InteractionChecker />;
}
