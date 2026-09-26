
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useEffect } from "react";

export function LiveKitDiagnostics() {
  const room = useRoomContext();
  
  useEffect(() => {
    if (!room) return;

    console.log("[LIVEKIT DEBUG] ROOM CONNECTION");
    console.log("serverUrl:", room.options.serverUrl); // Might not be directly on options in newer SDKs, but we can check state
    console.log("roomName:", room.name);
    console.log("identity:", room.localParticipant.identity);
    console.log("connectionState:", room.state);

    console.log("[LIVEKIT PARTICIPANT] Immediately after connecting:");
    console.log("local:", room.localParticipant.identity, "sid:", room.localParticipant.sid);
    console.log("remoteCount:", room.remoteParticipants.size);
    room.remoteParticipants.forEach(p => {
      console.log("remote:", p.identity, "sid:", p.sid);
    });

    const onParticipantConnected = (participant: any) => {
      console.log("[LIVEKIT PARTICIPANT] RoomEvent.ParticipantConnected", participant.identity);
    };
    const onParticipantDisconnected = (participant: any) => {
      console.log("[LIVEKIT PARTICIPANT] RoomEvent.ParticipantDisconnected", participant.identity);
    };

    const onLocalTrackPublished = (publication: any) => {
      console.log("[LIVEKIT DEBUG] LOCAL TRACK PUBLISHED");
      console.log("track SID:", publication.trackSid);
      console.log("track kind:", publication.kind);
      console.log("track source:", publication.source);
    };

    const onTrackPublished = (publication: any, participant: any) => {
      console.log("[LIVEKIT DEBUG] REMOTE TRACK PUBLISHED");
      console.log("participant:", participant.identity);
      console.log("publication SID:", publication.trackSid);
      console.log("track kind:", publication.kind);
      console.log("track source:", publication.source);
    };

    const onTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log("[LIVEKIT DEBUG] REMOTE TRACK SUBSCRIBED");
      console.log("participant:", participant.identity);
      console.log("track kind:", track.kind);
      console.log("track source:", publication.source);
      console.log("track object:", track);
      
      // Let us observe if it ever attaches
      setTimeout(() => {
        const els = track.attachedElements;
        console.log("[LIVEKIT DEBUG] ATTACHED ELEMENTS for", track.kind, ":", els?.length);
        if (els && els.length > 0) {
          const video = els[0] as HTMLVideoElement;
          console.log("video.srcObject:", !!video.srcObject);
          console.log("video.readyState:", video.readyState);
          console.log("video.paused:", video.paused);
          console.log("video dimensions:", video.videoWidth, "x", video.videoHeight);
        }
      }, 2000);
    };

    const onTrackSubscriptionFailed = (trackSid: any, participant: any, reason: any) => {
      console.log("[LIVEKIT DEBUG] REMOTE TRACK SUBSCRIPTION FAILED", trackSid, participant.identity, reason);
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
    room.on(RoomEvent.TrackPublished, onTrackPublished);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackSubscriptionFailed, onTrackSubscriptionFailed);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
      room.off(RoomEvent.TrackPublished, onTrackPublished);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackSubscriptionFailed, onTrackSubscriptionFailed);
    };
  }, [room]);

  return null;
}

