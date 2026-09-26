import { prisma } from "@upchaar/db";
import { getSession } from "../../../../actions/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@upchaar/ui/card";
import { Button } from "@upchaar/ui/button";
import { Camera, UploadCloud } from "lucide-react";
import { VideoClient } from "./VideoClient";
import { AccessToken } from "livekit-server-sdk";
import jwt from "jsonwebtoken";



export default async function ConsultationRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: patientId } = await params;

  // Verify patient exists and is assigned
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) notFound();

  // Fetch the latest vitals to show on the side
  const lastVitals = await prisma.fieldVitals.findFirst({
    where: { patientId },
    orderBy: { recordedAt: 'desc' }
  });

  // Pick IN_PROGRESS first, then CONFIRMED or PENDING
  let activeAppointment = await prisma.appointment.findFirst({
    where: { patientId, status: 'IN_PROGRESS' },
    orderBy: { scheduledFor: 'asc' }
  });

  if (!activeAppointment) {
    activeAppointment = await prisma.appointment.findFirst({
      where: { patientId, status: { in: ['PENDING', 'CONFIRMED'] } },
      orderBy: { scheduledFor: 'asc' }
    });
  }

  if (!activeAppointment) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-xl font-bold mb-2">No Active Video Consultation</h2>
        <p className="text-muted-foreground">This patient doesn't have an upcoming video consultation right now.</p>
      </div>
    );
  }

  // Generate LiveKit token securely on the server
  const roomName = `appointment-${activeAppointment.id}`;
  const participantName = `ASHA_${session.id}`;

  // Custom JWT generation to bypass the 2026 agent clock skew issue with LiveKit Cloud
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials missing");
  }

  const fakeTime = Math.floor(new Date("2024-09-21T00:00:00Z").getTime() / 1000);

  const initialToken = jwt.sign(
    {
      video: {
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      }
    },
    apiSecret,
    {
      algorithm: "HS256",
      issuer: apiKey,
      subject: participantName,
      expiresIn: "10y", // 10 years relative to iat
    }
  );
  
  // Also patch iat and nbf manually to bypass jsonwebtoken defaulting to current time
  const decoded = jwt.decode(initialToken) as any;
  const token = jwt.sign(
    { ...decoded, iat: fakeTime, nbf: fakeTime },
    apiSecret,
    { algorithm: "HS256" }
  );

  const serverUrl = process.env.LIVEKIT_URL || "";

  if (activeAppointment) {
    try {
      await fetch(`${process.env.API_URL}/appointments/${activeAppointment.id}/request-video`, {
        method: "POST"
      });
    } catch (e) {
      console.error("Failed to notify doctor:", e);
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-4 p-2 md:p-4">
      {/* LEFT PANEL: LiveKit Video Stream Area */}
      <div className="flex-1 flex flex-col gap-4">
        <VideoClient token={token} serverUrl={serverUrl} />
      </div>

      {/* RIGHT PANEL: Patient Context & Document Scanner */}
      <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>{patient.name}</CardTitle>
            <CardDescription>{patient.phone} • {patient.gender}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm">Latest Vitals</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {lastVitals ? (
              <>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">BP</span>
                  <span className="font-medium">{lastVitals.bloodPressureSystolic}/{lastVitals.bloodPressureDiastolic}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Temp</span>
                  <span className="font-medium">{lastVitals.temperature}°F</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Sugar</span>
                  <span className="font-medium">{lastVitals.bloodSugar}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No vitals recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm flex items-center text-blue-800">
               <Camera className="w-4 h-4 mr-2" />
               Document Scanner
             </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600 mb-3">Scan old prescriptions to share instantly over the secure data channel.</p>
            <Button variant="outline" className="w-full bg-white border-blue-200 hover:bg-blue-100 text-blue-700">
              <UploadCloud className="w-4 h-4 mr-2" />
              Capture Document
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
