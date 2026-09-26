import { prisma } from "@upchaar/db";
import { getSession } from "../../../actions/auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@upchaar/ui/card";
import { Button } from "@upchaar/ui/button";
import { Badge } from "@upchaar/ui/badge";
import { ArrowLeft, Activity, CalendarPlus } from "lucide-react";



export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: patientId } = await params;

  // Verify assignment
  const assignment = await prisma.healthWorkerPatientAssignment.findUnique({
    where: {
      healthWorkerId_patientId: {
        healthWorkerId: session.id,
        patientId,
      },
    },
  });

  if (!assignment) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { medicalHistory: true }
  });

  if (!patient) notFound();

  // Fetch last recorded vitals
  const lastVitals = await prisma.fieldVitals.findFirst({
    where: { patientId },
    orderBy: { recordedAt: 'desc' }
  });

  // Fetch active high risk flags
  const riskFlags = await prisma.highRiskFlag.findMany({
    where: { patientId },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Profile</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{patient.name}</CardTitle>
              <CardDescription className="text-base mt-1">
                {patient.gender} • {new Date().getFullYear() - patient.dateOfBirth.getFullYear()} years old
              </CardDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Phone: {patient.phone}</p>
          
          {riskFlags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {riskFlags.map(flag => (
                <Badge key={flag.id} variant="destructive">
                  {flag.category} Risk
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Last Recorded Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          {lastVitals ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                  <p className="font-semibold">{lastVitals.bloodPressureSystolic}/{lastVitals.bloodPressureDiastolic} mmHg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="font-semibold">{lastVitals.temperature}°F</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-semibold">{lastVitals.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Sugar</p>
                  <p className="font-semibold">{lastVitals.bloodSugar} mg/dL</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recorded on {lastVitals.recordedAt.toLocaleDateString()} at {lastVitals.recordedAt.toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="flex-1" size="lg">
          <Link href={`/patients/${patientId}/vitals`}>
            <Activity className="mr-2 h-4 w-4" />
            Record Vitals
          </Link>
        </Button>
        <Button asChild className="flex-1" size="lg">
          <Link href={`/patients/${patientId}/book`}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book Appointment
          </Link>
        </Button>
      </div>

      {/* Tele-Consult Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button asChild size="icon" className="h-16 w-16 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all">
          <Link href={`/patients/${patientId}/consultation`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            <span className="sr-only">Start Tele-Consult</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
