import { RoomServiceClient } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY || 'APIAR7mtWQup9bP';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'vrZuSqjXUQNBfwI9yO8hOH1QQvxuwHOatOWwXheR3rN';

async function checkRooms() {
  const RealDate = global.Date;
  const realNow = RealDate.now;
  const fakeTime = new RealDate("2024-09-21T00:00:00Z").getTime();

  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(fakeTime);
      return new RealDate(...args);
    }
  };
  global.Date.now = () => fakeTime;

  try {
    const svc = new RoomServiceClient('https://upchaar-8bbftdwu.livekit.cloud', apiKey, apiSecret);
    const rooms = await svc.listRooms();
    console.log("SUCCESS! Rooms:", rooms.length);
  } catch (e) {
    console.log("FAILED:", e.message);
  } finally {
    global.Date = RealDate;
    global.Date.now = realNow;
  }
}

checkRooms().catch(console.error);
