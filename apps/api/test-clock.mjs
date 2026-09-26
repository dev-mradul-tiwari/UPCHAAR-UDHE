import { SignJWT } from 'jose';

const apiKey = 'APIAR7mtWQup9bP';
const apiSecret = 'vrZuSqjXUQNBfwI9yO8hOH1QQvxuwHOatOWwXheR3rN';

async function generateToken(timestampSeconds) {
  const secret = new TextEncoder().encode(apiSecret);
  const jwt = await new SignJWT({
    video: { roomList: true }
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(apiKey)
    .setIssuedAt(timestampSeconds)
    .setExpirationTime(timestampSeconds + 3600)
    .setSubject('test-user')
    .sign(secret);
  return jwt;
}

async function checkRooms(timestampSeconds) {
  const token = await generateToken(timestampSeconds);
  const res = await fetch('https://upchaar-8bbftdwu.livekit.cloud/twirp/livekit.RoomService/ListRooms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  console.log(`\nTesting with timestamp ${new Date(timestampSeconds * 1000).toISOString()}`);
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text.slice(0, 200));
}

async function run() {
  // Try current machine time (2026)
  await checkRooms(Math.floor(Date.now() / 1000));
  
  // Try present day (roughly Sept 2024)
  await checkRooms(Math.floor(new Date('2024-09-21T00:00:00Z').getTime() / 1000));
}

run().catch(console.error);
