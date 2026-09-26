import { prisma } from "@upchaar/db";
import { getSession } from "../actions/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@upchaar/ui/card";
import { Users, UserPlus } from "lucide-react";
import { CreatePatientDialog } from "../../components/patients/create-patient-dialog";



export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Get assigned patients
  const assignments = await prisma.healthWorkerPatientAssignment.findMany({
    where: { healthWorkerId: session.id },
    select: { patientId: true },
  });
  
  const patientIds = assignments.map(a => a.patientId);
  const patientCount = patientIds.length;

  // Get high risk cases
  const highRiskCount = await prisma.highRiskFlag.count({
    where: { healthWorkerId: session.id },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">{session.name} ({session.role} Worker, {session.region})</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assigned Patients</CardDescription>
            <CardTitle className="text-4xl font-bold text-primary">{patientCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Risk Cases</CardDescription>
            <CardTitle className="text-4xl font-bold text-destructive">{highRiskCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Quick Actions</h2>
        
        <Link href="/patients" className="block">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center p-4">
              <div className="bg-primary/10 p-3 rounded-full mr-4 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Patient Directory</h3>
                <p className="text-sm text-muted-foreground">Manage your assigned patients</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <CreatePatientDialog triggerNode={
          <button className="block w-full text-left outline-none">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center p-4">
                <div className="bg-primary/10 p-3 rounded-full mr-4 text-primary">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Register New Patient</h3>
                  <p className="text-sm text-muted-foreground">Assign a new patient to your care</p>
                </div>
              </CardContent>
            </Card>
          </button>
        } />
      </div>
    </div>
  );
}
