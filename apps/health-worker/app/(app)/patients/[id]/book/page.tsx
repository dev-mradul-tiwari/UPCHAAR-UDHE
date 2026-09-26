import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { BookForm } from "./BookForm";
import type { HospitalSummary, Paginated } from "@upchaar/types";

type HospitalWithDepts = {
  id: string;
  name: string;
  departments: { id: string; name: string }[];
};

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = await params;

  // Fetch hospitals and all departments in parallel via the public API
  const [hospitalsResult, departmentsResult] = await Promise.all([
    apiRequest<Paginated<HospitalSummary>>("/hospitals", { query: { limit: 100 }, anonymous: true }),
    apiRequest<{ id: string; name: string; hospitalId: string }[]>("/departments", { anonymous: true }),
  ]);

  // Group departments by hospitalId and merge with hospitals
  const deptsByHospital = new Map<string, { id: string; name: string }[]>();
  for (const dept of departmentsResult) {
    if (!deptsByHospital.has(dept.hospitalId)) deptsByHospital.set(dept.hospitalId, []);
    deptsByHospital.get(dept.hospitalId)!.push({ id: dept.id, name: dept.name });
  }

  const hospitals: HospitalWithDepts[] = hospitalsResult.items.map((h) => ({
    id: h.id,
    name: h.name,
    departments: deptsByHospital.get(h.id) ?? [],
  }));

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
