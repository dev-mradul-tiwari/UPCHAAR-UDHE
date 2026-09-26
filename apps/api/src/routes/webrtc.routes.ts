import { Router } from "express";
import jwt from "jsonwebtoken";
import { requireAuth, getAuth } from "../middleware/auth.js";
import { ok } from "../utils/respond.js";

export const webrtcRouter: Router = Router();

// Generate a token for a user to join a specific appointment room
webrtcRouter.get("/token/:appointmentId", requireAuth(), async (req, res) => {
  const auth = getAuth(req);
  const { appointmentId } = req.params;

  const roomName = `appointment-${appointmentId}`;
  
  // Set identity to role + ID to distinguish participants
  const participantName = `${auth.role}_${auth.sub}`;

  // Custom JWT generation to bypass the 2026 agent clock skew issue with LiveKit Cloud
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials missing");
  }

  const fakeTime = Math.floor(new Date("2024-09-21T00:00:00Z").getTime() / 1000);

  const token = jwt.sign(
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
  const decoded = jwt.decode(token) as any;
  const patchedToken = jwt.sign(
    { ...decoded, iat: fakeTime, nbf: fakeTime },
    apiSecret,
    { algorithm: "HS256" }
  );

  ok(res, "WebRTC Token Generated", { token: patchedToken, roomName, url: process.env.LIVEKIT_URL });
});
