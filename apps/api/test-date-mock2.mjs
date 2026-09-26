import { RoomServiceClient } from 'livekit-server-sdk';

const apiKey = 'APIAR7mtWQuP9bP';
const apiSecret = 'vrZuSqjXUQNBfwI9yO8hOH1QQvxuwHOat0WwXheR3rN';

async function checkRooms() {
  const OriginalDate = global.Date;
  const fakeTime = new OriginalDate("2024-09-21T00:00:00Z").getTime();

  function FakeDate(...args) {
    if (args.length === 0) {
      return new OriginalDate(fakeTime);
    }
    return new OriginalDate(...args);
  }
  FakeDate.prototype = OriginalDate.prototype;
  FakeDate.now = () => fakeTime;
  FakeDate.parse = OriginalDate.parse;
  FakeDate.UTC = OriginalDate.UTC;

  global.Date = FakeDate;

  try {
    const svc = new RoomServiceClient('https://upchaar-8bbftdwu.livekit.cloud', apiKey, apiSecret);
    const rooms = await svc.listRooms();
    console.log("SUCCESS! Rooms:", rooms.length);
  } catch (e) {
    console.log("FAILED:", e.message);
  } finally {
    global.Date = OriginalDate;
  }
}

checkRooms().catch(console.error);
