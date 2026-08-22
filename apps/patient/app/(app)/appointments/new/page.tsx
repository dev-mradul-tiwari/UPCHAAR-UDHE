import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@upchaar/ui/skeleton";

import { BookAppointmentForm } from "@/components/appointments/book-appointment-form";

export const metadata: Metadata = { title: "Book an appointment" };

export default function NewAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-[32rem] w-full rounded-xl" />
        </div>
      }
    >
      <BookAppointmentForm />
    </Suspense>
  );
}
