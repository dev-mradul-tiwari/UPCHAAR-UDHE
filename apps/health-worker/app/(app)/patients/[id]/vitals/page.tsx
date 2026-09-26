import { recordVitals } from "../../../../actions/vitals";
import Link from "next/link";

export default async function VitalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = await params;

  return (
    <div className="p-4 max-w-md mx-auto w-full">
      <div className="flex items-center mb-6">
        <Link href={`/patients/${patientId}`} className="mr-4 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Record Vitals</h1>
      </div>

      <form action={recordVitals} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <input type="hidden" name="patientId" value={patientId} />
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (mmHg)</label>
          <div className="flex gap-2 items-center">
            <input type="number" name="sys" placeholder="Systolic (120)" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
            <span>/</span>
            <input type="number" name="dia" placeholder="Diastolic (80)" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Temperature (°F)</label>
          <input type="number" step="0.1" name="temp" placeholder="98.6" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
          <input type="number" step="0.1" name="weight" placeholder="65" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Blood Sugar (mg/dL)</label>
          <input type="number" name="sugar" placeholder="100" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
        </div>

        <button type="submit" className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg text-center shadow-sm mt-4">
          Save Vitals
        </button>
      </form>
    </div>
  );
}
