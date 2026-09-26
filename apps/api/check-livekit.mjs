import { RoomServiceClient } from 'livekit-server-sdk';

// Read from process.env since we'll run this where dotenv is loaded or pass explicitly
const url = process.env.LIVEKIT_URL || 'wss://upchaar-8bbftdwu.livekit.cloud';
const apiKey = process.env.LIVEKIT_API_KEY || 'APIAR7mtWQuP9bP';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'vrZuSqjXUQNBfwI9yO8hOH1QQvxuwHOat0WwXheR3rN';

async function checkRooms() {
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
