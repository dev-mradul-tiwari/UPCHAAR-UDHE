"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VideoClient } from "@/components/VideoClient";
import { Skeleton } from "@upchaar/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@upchaar/ui/card";
import { Video } from "lucide-react";

export function VideoConsultationSection({ appointmentId }: { appointmentId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["webrtc-token", appointmentId],
    queryFn: () => api.webrtc.token(appointmentId),
    refetchInterval: false,
    staleTime: Infinity,
  });

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Video className="h-5 w-5" />
          Video Consultation Room
        </CardTitle>
        <CardDescription>
          Your doctor will join this room when it is your turn. Please join and wait for them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : error || !data ? (
          <div className="p-4 bg-background rounded-lg border text-destructive text-sm">
            Failed to load video room credentials.
          </div>
        ) : (
          <div className="bg-background rounded-xl overflow-hidden border">
            <VideoClient token={data.token} serverUrl={data.url} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
