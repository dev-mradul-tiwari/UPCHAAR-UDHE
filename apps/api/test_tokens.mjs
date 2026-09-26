
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Doctor token for API
const doctorJwt = jwt.sign(
  { sub: "cmugm76fj000si1hgsmpx5ity", role: "DOCTOR" }, // from db
  process.env.JWT_SECRET || "replace-me-with-a-long-random-string",
  { expiresIn: "1h" }
);

async function test() {
  const appointmentId = "cmugm76mb003qi1hgsku38mu1";
  
  // Hit API
  const res = await fetch(`http://localhost:4000/api/v1/webrtc/token/${appointmentId}`, {
    headers: { "Authorization": `Bearer ${doctorJwt}` }
  });
  const data = await res.json();
  const doctorToken = data.data.token;
  
  console.log("DOCTOR WEBRTC TOKEN DECODED:");
  console.log(jwt.decode(doctorToken));

  // Health Worker token generation (same as code)
  const roomName = `appointment-${appointmentId}`;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  const fakeTime = Math.floor(new Date("2024-09-21T00:00:00Z").getTime() / 1000);
  const initialToken = jwt.sign(
    { video: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true } },
    apiSecret,
    { algorithm: "HS256", issuer: apiKey, subject: "ASHA_test", expiresIn: "10y" }
  );
  
  const decodedHW = jwt.decode(initialToken);
  const hwToken = jwt.sign(
    { ...decodedHW, iat: fakeTime, nbf: fakeTime },
    apiSecret,
    { algorithm: "HS256" }
  );

  console.log("HEALTH WORKER WEBRTC TOKEN DECODED:");
  console.log(jwt.decode(hwToken));
}

test();

