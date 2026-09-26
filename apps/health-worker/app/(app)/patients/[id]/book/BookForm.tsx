"use client";

import * as React from "react";
import { bookAppointmentOnBehalf } from "../../../../actions/appointment";
import { useFormStatus } from "react-dom";

type Hospital = {
  id: string;
  name: string;
  departments: { id: string; name: string }[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg text-center shadow-sm mt-4 hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? "Booking..." : "Confirm Booking"}
    </button>
  );
}

export function BookForm({ 
  patientId, 
  hospitals 
}: { 
  patientId: string; 
  hospitals: Hospital[];
}) {
  const [selectedHospitalId, setSelectedHospitalId] = React.useState<string>("");

  const activeDepartments = React.useMemo(() => {
    if (!selectedHospitalId) return [];
    return hospitals.find(h => h.id === selectedHospitalId)?.departments || [];
  }, [selectedHospitalId, hospitals]);

  return (
    <form action={bookAppointmentOnBehalf} className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border space-y-4">
      <input type="hidden" name="patientId" value={patientId} />
      
      <div>
        <label className="block text-sm font-medium mb-1">Select Hospital</label>
        <select 
          name="hospitalId" 
          required 
          value={selectedHospitalId}
          onChange={(e) => setSelectedHospitalId(e.target.value)}
          className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm"
        >
          <option value="">-- Choose Hospital --</option>
          {hospitals.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Select Department</label>
        <select 
          name="departmentId" 
          required 
          disabled={!selectedHospitalId}
          className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">-- Choose Department --</option>
          {activeDepartments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {!selectedHospitalId && (
          <p className="text-xs text-muted-foreground mt-1">Please select a hospital first.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date & Time</label>
        <input type="datetime-local" name="scheduledFor" required className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm" />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
        <input type="text" name="reason" placeholder="Routine checkup" className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder:text-muted-foreground" />
      </div>

      <SubmitButton />
    </form>
  );
}
