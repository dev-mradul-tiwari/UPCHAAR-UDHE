"use client";

import * as React from "react";
import { LiveKitRoom, VideoConference, PreJoin } from "@livekit/components-react";
import "@livekit/components-styles";
import { Card } from "@upchaar/ui/card";

export function VideoClient({ token, serverUrl }: { token: string, serverUrl: string }) {
  const [choices, setChoices] = React.useState<{ videoEnabled: boolean; audioEnabled: boolean } | undefined>(undefined);

  if (!token || !serverUrl) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50/10 rounded-xl border border-red-200">
        <p className="font-bold">Missing LiveKit Keys</p>
        <p className="text-sm">Cannot connect to video room because LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET is missing from the .env file.</p>
      </div>
    );
  }

  if (!choices) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center overflow-hidden border-2 border-slate-200 min-h-[500px]" data-lk-theme="default">
        <PreJoin
          defaults={{
            videoEnabled: true,
            audioEnabled: true,
          }}
          onSubmit={setChoices}
          className="lk-prejoin"
        />
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border-2 border-slate-200 min-h-[500px]" data-lk-theme="default">
      <LiveKitRoom
        video={choices.videoEnabled}
        audio={choices.audioEnabled}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        className="flex-1 h-full w-full flex flex-col relative"
        data-lk-theme="default"
      >
        <RoomStatusBadge />
        <VideoConference />
      </LiveKitRoom>
    </Card>
  );
}

import { useParticipants } from "@livekit/components-react";

function RoomStatusBadge() {
  const participants = useParticipants();
  return (
    <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-semibold border border-white/20 flex items-center gap-2 shadow-xl">
      <div className={`w-2 h-2 rounded-full ${participants.length > 1 ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
      {participants.length} {participants.length === 1 ? 'Person' : 'People'} Connected
    </div>
  );
}
