
import { RoomServiceClient } from "livekit-server-sdk";

const apiKey = "APIAR7mtWQup9bP";
const apiSecret = "vrZuSqjXUQNBfwI9yO8hOH1QQvxuwHOatOWwXheR3rN";
const host = "https://upchaar-8bbftdwu.livekit.cloud";

const svc = new RoomServiceClient(host, apiKey, apiSecret);

async function checkRooms() {
  const rooms = await svc.listRooms();
  console.log("ACTIVE ROOMS:");
  for (const room of rooms) {
    console.log("- Room:", room.name, "Participants:", room.numParticipants);
    const participants = await svc.listParticipants(room.name);
    for (const p of participants) {
      console.log("  -", p.identity);
    }
  }
}

checkRooms().catch(console.error);

