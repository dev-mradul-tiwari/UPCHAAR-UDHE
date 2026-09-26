import { RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function checkRooms() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!url || !apiKey || !apiSecret) {
    console.error("Missing LiveKit credentials");
    process.exit(1);
  }

  const svc = new RoomServiceClient(url, apiKey, apiSecret);
  const rooms = await svc.listRooms();
  console.log("Active Rooms:", rooms.length);
  
  for (const room of rooms) {
    console.log(`\nRoom: ${room.name}`);
    const participants = await svc.listParticipants(room.name);
    console.log(`Participants: ${participants.length}`);
    participants.forEach(p => {
      console.log(`  - ${p.identity} (joined at ${new Date(p.joinedAt * 1000).toISOString()})`);
    });
  }
}

checkRooms().catch(console.error);
