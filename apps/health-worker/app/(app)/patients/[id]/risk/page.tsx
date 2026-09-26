import { flagHighRisk } from "../../../../actions/risk";
import Link from "next/link";

export default async function RiskPage({
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
        <h1 className="text-xl font-bold text-slate-800">Flag High Risk</h1>
      </div>

      <form action={flagHighRisk} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <input type="hidden" name="patientId" value={patientId} />
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Risk Category</label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input type="radio" name="category" value="Pregnant" required className="h-5 w-5 text-blue-600" />
              <span className="text-slate-800 font-medium">Pregnant</span>
            </label>
            <label className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input type="radio" name="category" value="Chronic Illness" required className="h-5 w-5 text-blue-600" />
              <span className="text-slate-800 font-medium">Chronic Illness</span>
            </label>
            <label className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input type="radio" name="category" value="Elderly" required className="h-5 w-5 text-blue-600" />
              <span className="text-slate-800 font-medium">Elderly</span>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg text-center shadow-sm mt-4">
          Flag Patient
        </button>
      </form>
    </div>
  );
}
