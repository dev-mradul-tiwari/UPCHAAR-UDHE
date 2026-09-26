import { redirect } from "next/navigation";
import { prisma } from "@upchaar/db";

export default async function ConsultationRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params;
  
  const activeAppointment = await prisma.appointment.findFirst({ 
    where: { patientId, status: "IN_PROGRESS" }, 
    select: { id: true } 
  });
  
  if (activeAppointment) { 
    redirect(`/consultation/${activeAppointment.id}`); 
  }
  
  return (
    <div className="p-8 text-center text-red-500">
      <p className="font-bold">No active appointment</p>
    </div>
  );
}
