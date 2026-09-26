"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VideoClient } from "@/components/VideoClient";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@upchaar/ui/button";

export function VideoConsultationView({ appointmentId }: { appointmentId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["webrtc-token", appointmentId],
    queryFn: () => api.webrtc.token(appointmentId),
    refetchInterval: false,
    staleTime: Infinity,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/queue">
          <ArrowLeft aria-hidden className="mr-2" />
          Back to Queue
        </Link>
      </Button>

      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Video className="h-5 w-5" />
            Video Consultation Room
          </CardTitle>
          <CardDescription>
            You are consulting with the patient for appointment #{appointmentId.substring(0, 8)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : error || !data ? (
            <div className="p-4 bg-background rounded-lg border text-destructive text-sm">
              Failed to load video room credentials. Please ensure the patient is ready.
            </div>
          ) : (
            <div className="bg-background rounded-xl overflow-hidden border">
              <VideoClient token={data.token} serverUrl={data.url} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
