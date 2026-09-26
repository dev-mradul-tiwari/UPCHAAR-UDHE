import { prisma } from "@upchaar/db";
import { getSession } from "../../actions/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@upchaar/ui/card";
import { CreatePatientDialog } from "../../../components/patients/create-patient-dialog";
import { AssignPatientDialog } from "../../../components/patients/assign-patient-dialog";



export default async function PatientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const assignments = await prisma.healthWorkerPatientAssignment.findMany({
    where: { healthWorkerId: session.id },
    select: { patientId: true },
  });

  const patientIds = assignments.map(a => a.patientId);

  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    select: {
      id: true,
      name: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Patients</h1>
        <div className="flex items-center gap-3">
          <AssignPatientDialog />
          <CreatePatientDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.length === 0 ? (
          <p className="text-muted-foreground py-8">No patients assigned yet.</p>
        ) : (
          patients.map(patient => (
            <Link href={`/patients/${patient.id}`} key={patient.id}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <CardDescription>
                    {patient.gender} • {new Date().getFullYear() - patient.dateOfBirth.getFullYear()} yrs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-primary font-medium">View Profile &rarr;</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
