import { prisma } from "@upchaar/db";
import { bookAppointmentOnBehalf } from "../../../../actions/appointment";
import Link from "next/link";
import { BookForm } from "./BookForm";
export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = await params;
  
  // Fetch available hospitals and departments for the form
  const hospitals = await prisma.hospital.findMany({
    include: { departments: true }
  });

  // For simplicity in a single-page form, we'll just flatten them or use simple selects
  // In a real app, this would use client-side React to filter departments by hospital

  return (
    <div className="p-4 max-w-md mx-auto w-full">
      <div className="flex items-center mb-6">
        <Link href={`/patients/${patientId}`} className="mr-4 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Book Appointment</h1>
      </div>

      <BookForm patientId={patientId} hospitals={hospitals} />
    </div>
  );
}
